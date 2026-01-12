// pages/AccountingDashboard.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storage } from '../utils/storage';
import { Customer, Transaction } from '../types';
import { Users, TrendingUp, TrendingDown, IndianRupee, Calendar, ArrowRight } from 'lucide-react';
import { customerApi, transactionApi } from '../utils/api';

const AccountingDashboard: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    totalTransactions: 0,
    totalDebit: 0,
    totalCredit: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load customers from MongoDB
      const customersResponse = await customerApi.getAll();
      const allCustomers = customersResponse.data || customersResponse || [];
      
      // Load transactions from MongoDB for each customer
      let allTransactions: Transaction[] = [];
      for (const customer of allCustomers) {
        try {
          const response = await transactionApi.getCustomerTransactions(customer.id);
          if (response && Array.isArray(response)) {
            allTransactions = [...allTransactions, ...response];
          } else if (response && response.data && Array.isArray(response.data)) {
            allTransactions = [...allTransactions, ...response.data];
          }
        } catch (error) {
          console.error(`Failed to load transactions for customer ${customer.id}:`, error);
        }
      }
      
      // Get recent transactions (last 5)
      const recent = [...allTransactions]
        .sort((a, b) => new Date(b.createdAt || b.transactionDate || '').getTime() - new Date(a.createdAt || a.transactionDate || '').getTime())
        .slice(0, 5);
      
      // Calculate stats
      let totalDebit = 0;
      let totalCredit = 0;
      allTransactions.forEach(t => {
        totalDebit += t.debitAmount || 0;
        totalCredit += t.creditAmount || 0;
      });
      
      setCustomers(allCustomers);
      setRecentTransactions(recent);
      setStats({
        totalCustomers: allCustomers.length,
        activeCustomers: allCustomers.filter((c: Customer) => c.isActive).length,
        totalTransactions: allTransactions.length,
        totalDebit,
        totalCredit
      });
    } catch (error) {
      console.error('Failed to load dashboard data from MongoDB:', error);
      // Fallback to localStorage
      console.log('Falling back to localStorage...');
      const localCustomers = storage.getCustomers();
      const localTransactions = storage.loadTransactions();
      
      const recent = [...localTransactions]
        .sort((a, b) => new Date(b.createdAt || b.transactionDate || '').getTime() - new Date(a.createdAt || a.transactionDate || '').getTime())
        .slice(0, 5);
      
      let totalDebit = 0;
      let totalCredit = 0;
      localTransactions.forEach(t => {
        totalDebit += t.debitAmount || 0;
        totalCredit += t.creditAmount || 0;
      });
      
      setCustomers(localCustomers);
      setRecentTransactions(recent);
      setStats({
        totalCustomers: localCustomers.length,
        activeCustomers: localCustomers.filter(c => c.isActive).length,
        totalTransactions: localTransactions.length,
        totalDebit,
        totalCredit
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Accounting Dashboard</h1>
          <p className="text-gray-600">Overview of your vetiver farming finances</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Customers</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{stats.totalCustomers}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
            <div className="mt-3 md:mt-4">
              <span className="text-xs md:text-sm text-green-600">
                {stats.activeCustomers} active • {stats.totalCustomers - stats.activeCustomers} inactive
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-xl md:text-2xl font-bold text-gray-800">{stats.totalTransactions}</p>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-3 md:mt-4">
              <span className="text-xs md:text-sm text-blue-600">Across all customers</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-red-600" />
                  <p className="text-xl md:text-2xl font-bold text-red-700">
                    {stats.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-5 h-5 md:w-6 md:h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Investments</p>
                <div className="flex items-center gap-1">
                  <IndianRupee className="w-4 h-4 text-green-600" />
                  <p className="text-xl md:text-2xl font-bold text-green-700">
                    {stats.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
              <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 md:w-6 md:h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800 mb-3 md:mb-4">Quick Actions</h2>
              <div className="space-y-2 md:space-y-3">
                <Link
                  to="/customers"
                  className="block w-full py-2 md:py-3 bg-green-600 text-white text-center rounded-lg font-medium hover:bg-green-700 transition-colors text-sm md:text-base"
                >
                  View All Customers
                </Link>
                <Link
                  to="/customers"
                  className="block w-full py-2 md:py-3 border-2 border-green-600 text-green-600 text-center rounded-lg font-medium hover:bg-green-50 transition-colors text-sm md:text-base"
                >
                  Add New Customer
                </Link>
              </div>
              
              {/* Recent Customers */}
              <div className="mt-6 md:mt-8">
                <h3 className="font-medium text-gray-700 mb-2 md:mb-3">Recent Customers</h3>
                <div className="space-y-2 md:space-y-3">
                  {customers.slice(0, 3).map(customer => (
                    <Link
                      key={customer.id}
                      to={`/accounting/${customer.id}`}
                      className="flex items-center justify-between p-2 md:p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                    >
                      <div>
                        <p className="font-medium text-gray-800 text-sm md:text-base">{customer.fullName}</p>
                        <p className="text-xs md:text-sm text-gray-500">{customer.contactNumber}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 h-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Recent Transactions</h2>
                <span className="text-xs md:text-sm text-gray-500 mt-1 sm:mt-0">Last 5 transactions</span>
              </div>
              
              {recentTransactions.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
                    <Calendar className="w-6 h-6 md:w-8 md:h-8 text-gray-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-medium text-gray-700 mb-1 md:mb-2">No Transactions Yet</h3>
                  <p className="text-gray-500 text-sm md:text-base">Start by adding customers and transactions</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="pb-2 md:pb-3 text-left text-xs md:text-sm font-medium text-gray-500">Customer</th>
                        <th className="pb-2 md:pb-3 text-left text-xs md:text-sm font-medium text-gray-500">Type</th>
                        <th className="pb-2 md:pb-3 text-left text-xs md:text-sm font-medium text-gray-500">Amount</th>
                        <th className="pb-2 md:pb-3 text-left text-xs md:text-sm font-medium text-gray-500">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentTransactions.map(transaction => {
                        const customer = customers.find(c => c.id === transaction.customerId);
                        const isDebit = transaction.debitAmount > 0;
                        
                        return (
                          <tr key={transaction.id} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 md:py-3">
                              <p className="font-medium text-gray-800 text-sm md:text-base">{customer?.fullName || 'Unknown'}</p>
                            </td>
                            <td className="py-2 md:py-3">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                isDebit ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                              }`}>
                                {isDebit ? 'Expense' : 'Investment'}
                              </span>
                            </td>
                            <td className="py-2 md:py-3">
                              <div className="flex items-center gap-1">
                                <IndianRupee className={`w-3 h-3 md:w-4 md:h-4 ${isDebit ? 'text-red-600' : 'text-green-600'}`} />
                                <span className={`font-medium text-sm md:text-base ${isDebit ? 'text-red-700' : 'text-green-700'}`}>
                                  {(isDebit ? transaction.debitAmount : transaction.creditAmount).toFixed(2)}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 md:py-3 text-gray-600 text-sm md:text-base">
                              {new Date(transaction.transactionDate || transaction.createdAt || '').toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
              
              {recentTransactions.length > 0 && (
                <div className="mt-4 md:mt-6 text-center">
                  <Link
                    to="/customers"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium text-sm md:text-base"
                  >
                    View all transactions
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingDashboard;