// src/pages/ReportPage.tsx - COMPLETE REDESIGN with MongoDB
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { storage } from '../utils/storage';
import { customerApi, transactionApi } from '../utils/api';
import { 
  Download, 
  Filter, 
  Calendar,
  Users,
  User,
  IndianRupee,
  TrendingUp,
  TrendingDown,
  BarChart3,
  FileText
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load customers from MongoDB
      const customersResponse = await customerApi.getAll();
      const allCustomers = customersResponse.data || customersResponse || [];
      
      // Load transactions from MongoDB for each customer
      let allTransactions: any[] = [];
      for (const customer of allCustomers) {
        try {
          const response = await transactionApi.getCustomerTransactions(customer.id);
          if (response && Array.isArray(response)) {
            allTransactions = [...allTransactions, ...response.map(t => ({ ...t, customerId: customer.id }))];
          } else if (response && response.data && Array.isArray(response.data)) {
            allTransactions = [...allTransactions, ...response.data.map((t: any) => ({ ...t, customerId: customer.id }))];
          }
        } catch (error) {
          console.error(`Failed to load transactions for customer ${customer.id}:`, error);
        }
      }
      
      // Map MongoDB customers to frontend format
      const mongoCustomers = allCustomers.map((customer: any) => ({
        id: customer._id || customer.id,
        aadhaarNumber: customer.aadhaarNumber || '',
        fullName: customer.fullName || '',
        gender: (customer.gender as 'Male' | 'Female' | 'Other') || 'Male',
        dateOfBirth: customer.dateOfBirth || '',
        address: customer.address || '',
        contactNumber: customer.contactNumber || '',
        email: customer.email || '',
        profileImage: customer.profileImage || '',
        createdAt: customer.createdAt ? new Date(customer.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        isActive: customer.isActive !== undefined ? customer.isActive : true,
        projects: customer.projects || [],
        updatedAt: customer.updatedAt || ''
      }));
      
      setCustomers(mongoCustomers);
      setTransactions(allTransactions);
      
    } catch (error) {
      console.error('Failed to load data from MongoDB:', error);
      
      // Fallback to localStorage
      console.log('Falling back to localStorage...');
      const localCustomers = storage.getCustomers();
      const localTransactions = storage.loadTransactions();
      
      setCustomers(localCustomers);
      setTransactions(localTransactions);
      
    } finally {
      setLoading(false);
    }
  };

  // Filter transactions by date range
  const filterTransactionsByDate = (transactionsToFilter: any[]) => {
    if (!dateRange.start || !dateRange.end) return transactionsToFilter;
    
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    
    return transactionsToFilter.filter(transaction => {
      const transDate = new Date(transaction.transactionDate || transaction.createdAt || '');
      return transDate >= startDate && transDate <= endDate;
    });
  };

  // Get financial summary for all or selected customer
  const getFinancialSummary = () => {
    if (selectedCustomer === 'all') {
      // Calculate totals for all customers
      let totalDebit = 0;
      let totalCredit = 0;
      let totalTransactions = 0;
      
      customers.forEach(customer => {
        const customerTransactions = transactions.filter(t => t.customerId === customer.id);
        const filteredTransactions = filterTransactionsByDate(customerTransactions);
        
        let customerDebit = 0;
        let customerCredit = 0;
        
        filteredTransactions.forEach(transaction => {
          totalDebit += transaction.debitAmount || 0;
          totalCredit += transaction.creditAmount || 0;
        });
        
        totalDebit += customerDebit;
        totalCredit += customerCredit;
        totalTransactions += filteredTransactions.length;
      });
      
      const balance = totalCredit - totalDebit;
      
      return {
        totalDebit,
        totalCredit,
        balance,
        totalTransactions,
        customerCount: customers.length,
        isProfit: balance >= 0
      };
    } else {
      // Get summary for selected customer
      const customerTransactions = transactions.filter(t => t.customerId === selectedCustomer);
      const filteredTransactions = filterTransactionsByDate(customerTransactions);
      
      let totalDebit = 0;
      let totalCredit = 0;
      
      filteredTransactions.forEach(transaction => {
        totalDebit += transaction.debitAmount || 0;
        totalCredit += transaction.creditAmount || 0;
      });
      
      const balance = totalCredit - totalDebit;
      const customer = customers.find(c => c.id === selectedCustomer);
      
      return {
        totalDebit,
        totalCredit,
        balance,
        totalTransactions: filteredTransactions.length,
        customerCount: 1,
        isProfit: balance >= 0,
        customerName: customer?.fullName
      };
    }
  };

  const summary = getFinancialSummary();

  const handleExportReport = () => {
    const headers = ['Customer Name', 'Aadhaar', 'Phone', 'Total Debit', 'Total Credit', 'Balance', 'Transactions', 'Status'];
    const csvData = customers.map(customer => {
      const customerTransactions = transactions.filter(t => t.customerId === customer.id);
      const filteredTransactions = filterTransactionsByDate(customerTransactions);
      
      let customerDebit = 0;
      let customerCredit = 0;
      
      filteredTransactions.forEach(transaction => {
        customerDebit += transaction.debitAmount || 0;
        customerCredit += transaction.creditAmount || 0;
      });
      
      const customerBalance = customerCredit - customerDebit;
      
      return [
        customer.fullName,
        customer.aadhaarNumber,
        customer.contactNumber,
        customerDebit.toFixed(2),
        customerCredit.toFixed(2),
        customerBalance.toFixed(2),
        filteredTransactions.length,
        customer.isActive ? 'Active' : 'Inactive'
      ];
    });
    
    // Add totals row
    csvData.push([
      'TOTAL',
      '',
      '',
      summary.totalDebit.toFixed(2),
      summary.totalCredit.toFixed(2),
      summary.balance.toFixed(2),
      summary.totalTransactions,
      ''
    ]);
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `financial_report_${dateRange.start}_to_${dateRange.end}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportPDF = async () => {
    try {
      // Create a temporary div for PDF content
      const pdfContent = document.createElement('div');
      pdfContent.style.position = 'absolute';
      pdfContent.style.left = '-9999px';
      pdfContent.style.top = '0';
      pdfContent.style.width = '1200px';
      pdfContent.style.backgroundColor = '#ffffff';
      pdfContent.style.padding = '20px';
      
      // Build PDF content
      let htmlContent = `
        <div style="font-family: Arial, sans-serif;">
          <!-- Header -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="font-size: 24px; color: #1f2937; margin-bottom: 5px;">Financial Report</h1>
            <p style="font-size: 14px; color: #6b7280;">
              Date Range: ${dateRange.start} to ${dateRange.end}
            </p>
            ${selectedCustomer !== 'all' ? `
              <p style="font-size: 14px; color: #6b7280;">
                Customer: ${customers.find(c => c.id === selectedCustomer)?.fullName}
              </p>
            ` : ''}
          </div>
      `;
      
      if (selectedCustomer === 'all') {
        // For all customers: Show individual summaries
        htmlContent += `<h2 style="font-size: 18px; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">Customer-wise Financial Summary</h2>`;
        
        customers.forEach((customer, index) => {
          const customerTransactions = transactions.filter(t => t.customerId === customer.id);
          const filteredTransactions = filterTransactionsByDate(customerTransactions);
          
          let customerDebit = 0;
          let customerCredit = 0;
          
          filteredTransactions.forEach(transaction => {
            customerDebit += transaction.debitAmount || 0;
            customerCredit += transaction.creditAmount || 0;
          });
          
          const customerBalance = customerCredit - customerDebit;
          
          htmlContent += `
            <div style="margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f9fafb;">
              <h3 style="font-size: 16px; color: #1f2937; margin-bottom: 10px;">${index + 1}. ${customer.fullName}</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                <div>
                  <p style="font-size: 12px; color: #6b7280;">Aadhaar</p>
                  <p style="font-size: 14px; color: #1f2937;">${customer.aadhaarNumber}</p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #6b7280;">Phone</p>
                  <p style="font-size: 14px; color: #1f2937;">${customer.contactNumber}</p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #dc2626;">Total Expenses</p>
                  <p style="font-size: 16px; color: #dc2626; font-weight: bold;">₹${customerDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #16a34a;">Total Investments</p>
                  <p style="font-size: 16px; color: #16a34a; font-weight: bold;">₹${customerCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #1f2937;">Balance</p>
                  <p style="font-size: 18px; color: ${customerBalance >= 0 ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                    ₹${Math.abs(customerBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    <span style="font-size: 12px; color: ${customerBalance >= 0 ? '#16a34a' : '#dc2626'};">
                      (${customerBalance >= 0 ? 'Profit' : 'Loss'})
                    </span>
                  </p>
                </div>
                <div>
                  <p style="font-size: 12px; color: #1f2937;">Transactions</p>
                  <p style="font-size: 16px; color: #1f2937; font-weight: bold;">${filteredTransactions.length}</p>
                </div>
              </div>
            </div>
          `;
        });
        
        // Add overall Financial Summary
        htmlContent += `
          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #1f2937;">
            <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 20px;">Overall Financial Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
              <div style="text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px;">
                <p style="font-size: 12px; color: #6b7280;">Total Customers</p>
                <p style="font-size: 24px; color: #1f2937; font-weight: bold;">${summary.customerCount}</p>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2;">
                <p style="font-size: 12px; color: #dc2626;">Total Expenses</p>
                <p style="font-size: 24px; color: #dc2626; font-weight: bold;">₹${summary.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4;">
                <p style="font-size: 12px; color: #16a34a;">Total Investments</p>
                <p style="font-size: 24px; color: #16a34a; font-weight: bold;">₹${summary.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="text-align: center; padding: 15px; border: 1px solid ${summary.isProfit ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; background: ${summary.isProfit ? '#f0fdf4' : '#fef2f2'}">
                <p style="font-size: 12px; color: #1f2937;">Net Balance</p>
                <p style="font-size: 24px; color: ${summary.isProfit ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                  ₹${Math.abs(summary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p style="font-size: 14px; color: ${summary.isProfit ? '#16a34a' : '#dc2626'}; margin-top: 5px;">
                  ${summary.isProfit ? 'Profit' : 'Loss'}
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; padding: 10px; background: #f3f4f6; border-radius: 6px;">
              <p style="font-size: 14px; color: #1f2937;">
                Total Transactions: <span style="font-weight: bold;">${summary.totalTransactions}</span>
              </p>
            </div>
          </div>
        `;
      } else {
        // For single customer: Show only their summary
        const customer = customers.find(c => c.id === selectedCustomer);
        if (customer) {
          htmlContent += `
            <h2 style="font-size: 18px; color: #1f2937; margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
              Financial Summary - ${customer.fullName}
            </h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 30px;">
              <div>
                <p style="font-size: 12px; color: #6b7280;">Aadhaar</p>
                <p style="font-size: 14px; color: #1f2937;">${customer.aadhaarNumber}</p>
              </div>
              <div>
                <p style="font-size: 12px; color: #6b7280;">Phone</p>
                <p style="font-size: 14px; color: #1f2937;">${customer.contactNumber}</p>
              </div>
            </div>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
              <div style="text-align: center; padding: 20px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2;">
                <p style="font-size: 12px; color: #dc2626;">Total Expenses</p>
                <p style="font-size: 24px; color: #dc2626; font-weight: bold;">₹${summary.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="text-align: center; padding: 20px; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4;">
                <p style="font-size: 12px; color: #16a34a;">Total Investments</p>
                <p style="font-size: 24px; color: #16a34a; font-weight: bold;">₹${summary.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
              </div>
              <div style="text-align: center; padding: 20px; border: 1px solid ${summary.isProfit ? '#bbf7d0' : '#fecaca'}; border-radius: 8px; background: ${summary.isProfit ? '#f0fdf4' : '#fef2f2'}">
                <p style="font-size: 12px; color: #1f2937;">Net Balance</p>
                <p style="font-size: 28px; color: ${summary.isProfit ? '#16a34a' : '#dc2626'}; font-weight: bold;">
                  ₹${Math.abs(summary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </p>
                <p style="font-size: 16px; color: ${summary.isProfit ? '#16a34a' : '#dc2626'}; margin-top: 10px;">
                  ${summary.isProfit ? 'Profit' : 'Loss'}
                </p>
              </div>
            </div>
            <div style="text-align: center; margin-top: 20px; padding: 15px; background: #f3f4f6; border-radius: 6px;">
              <p style="font-size: 16px; color: #1f2937;">
                Total Transactions: <span style="font-weight: bold;">${summary.totalTransactions}</span>
              </p>
            </div>
          `;
        }
      }
      
      htmlContent += `</div>`;
      pdfContent.innerHTML = htmlContent;
      document.body.appendChild(pdfContent);
      
      // Generate PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`financial_report_${dateRange.start}_to_${dateRange.end}.pdf`);
      
      // Clean up
      document.body.removeChild(pdfContent);
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Financial Reports</h1>
          <p className="text-gray-600 mt-2">View financial summaries for customers</p>
        </div>

        {/* Report content container with ID for PDF generation */}
        <div id="report-content">
          {/* Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Customer Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="w-4 h-4 inline mr-2" />
                  Customer
                </label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                >
                  <option value="all">All Customers</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  From Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  To Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-sm md:text-base"
                />
              </div>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="mb-6 md:mb-8">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
              Financial Summary {selectedCustomer !== 'all' && `- ${summary.customerName}`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {/* Total Customers */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Total Customers</h3>
                    <p className="text-xs text-gray-500">Active accounts</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl md:text-3xl font-bold text-gray-800">
                      {summary.customerCount}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Total Debit */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-red-700">Total Expenses</h3>
                    <p className="text-xs text-red-600">Debit Amount</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-red-600" />
                      <span className="text-2xl md:text-3xl font-bold text-red-700">
                        {summary.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Total Credit */}
              <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-green-700">Total Investments</h3>
                    <p className="text-xs text-green-600">Credit Amount</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IndianRupee className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                      <span className="text-2xl md:text-3xl font-bold text-green-700">
                        {summary.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Balance */}
              <div className={`bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-200 ${
                summary.isProfit ? 'border-green-200' : 'border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Net Balance</h3>
                    <p className="text-xs text-gray-600">Overall position</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IndianRupee className="w-4 h-4 md:w-5 md:h-5" />
                      <span className={`text-2xl md:text-3xl font-bold ${
                        summary.isProfit ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {Math.abs(summary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-2">
                      {summary.isProfit ? (
                        <>
                          <TrendingUp className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                          <span className="text-xs md:text-sm font-medium text-green-600">Profit</span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                          <span className="text-xs md:text-sm font-medium text-red-600">Loss</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Total Transactions */}
            <div className="mt-4 md:mt-6 text-center">
              <div className="inline-flex items-center gap-2 bg-gray-50 px-4 md:px-6 py-2 md:py-3 rounded-lg">
                <FileText className="w-4 h-4 md:w-5 md:h-5 text-gray-600" />
                <span className="text-gray-700 text-sm md:text-base">
                  Total Transactions: <span className="font-bold">{summary.totalTransactions}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Customer-wise Details */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-lg md:text-xl font-bold text-gray-800">Customer Details</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <button
                    onClick={handleExportReport}
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 flex items-center gap-2 justify-center"
                  >
                    <Download className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Export CSV</span>
                  </button>
                  <button
                    onClick={handleExportPDF}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 justify-center"
                  >
                    <FileText className="w-4 h-4 md:w-5 md:h-5" />
                    <span className="text-sm md:text-base">Export PDF</span>
                  </button>
                </div>
              </div>
            </div>
            
            {customers.length === 0 ? (
              <div className="p-8 md:p-12 text-center">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                </div>
                <h3 className="text-base md:text-lg font-medium text-gray-700 mb-2">No Customers Found</h3>
                <p className="text-gray-500 text-sm md:text-base">Add customers to see financial reports</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[800px]">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Customer Name</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Aadhaar</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Phone</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Total Debit</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Total Credit</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Balance</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Transactions</th>
                      <th className="p-3 md:p-4 text-left text-xs md:text-sm font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {customers.map(customer => {
                      const customerTransactions = transactions.filter(t => t.customerId === customer.id);
                      const filteredTransactions = filterTransactionsByDate(customerTransactions);
                      
                      let customerDebit = 0;
                      let customerCredit = 0;
                      
                      filteredTransactions.forEach(transaction => {
                        customerDebit += transaction.debitAmount || 0;
                        customerCredit += transaction.creditAmount || 0;
                      });
                      
                      const customerBalance = customerCredit - customerDebit;
                      
                      return (
                        <tr key={customer.id} className="hover:bg-gray-50">
                          <td className="p-3 md:p-4">
                            <div className="font-medium text-gray-800 text-sm md:text-base">{customer.fullName}</div>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="font-mono text-xs md:text-sm">{customer.aadhaarNumber}</div>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="text-gray-700 text-sm md:text-base">{customer.contactNumber}</div>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-red-600" />
                              <span className="font-medium text-red-700 text-sm md:text-base">
                                {customerDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                              <span className="font-medium text-green-700 text-sm md:text-base">
                                {customerCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className={`flex items-center gap-1 ${customerBalance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                              <IndianRupee className="w-3 h-3 md:w-4 md:h-4" />
                              <span className="font-bold text-sm md:text-base">
                                {Math.abs(customerBalance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                            <div className={`text-xs mt-1 ${customerBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {customerBalance >= 0 ? 'Profit' : 'Loss'}
                            </div>
                          </td>
                          <td className="p-3 md:p-4">
                            <div className="text-center">
                              <span className="px-2 py-1 md:px-3 md:py-1 bg-gray-100 text-gray-700 rounded-full text-xs md:text-sm">
                                {filteredTransactions.length}
                              </span>
                            </div>
                          </td>
                          <td className="p-3 md:p-4">
                            <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium ${
                              customer.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {customer.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportPage;