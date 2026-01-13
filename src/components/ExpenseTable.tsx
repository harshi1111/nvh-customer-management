// components/ExpenseTable.tsx - UPDATED WITH MONGODB SUPPORT AND SERIAL NUMBER FIX
import React, { useState, useEffect } from 'react';
import { ExpenseType, expenseConfig, Transaction } from '../types';
import { storage } from '../utils/storage';
import { transactionApi } from '../utils/api'; // ADD THIS IMPORT
import { 
  Plus, 
  Trash2, 
  Calculator, 
  IndianRupee, 
  Save, 
  Edit2, 
  X,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface ExpenseTableProps {
  customerId: string;
  projectId: string;
  customerName: string;
  onTransactionsChange?: () => void;
}

const ExpenseTable: React.FC<ExpenseTableProps> = ({ 
  customerId, 
  projectId,
  customerName, 
  onTransactionsChange 
}) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string>('');
  const [isAdding, setIsAdding] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  // Load transactions from both MongoDB and LocalStorage
  useEffect(() => {
    loadTransactions();
  }, [customerId, projectId]);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // FIX: Update the loadTransactions function to ensure proper serials:
  const loadTransactions = async () => {
    setLoading(true);
    try {
      // Try to load from MongoDB first
      const response = await transactionApi.getCustomerTransactions(customerId, projectId);
      console.log('MongoDB transactions response:', response);
      
      let mongoTransactions: Transaction[] = [];
      
      if (response && response.data && Array.isArray(response.data)) {
        mongoTransactions = response.data.map((t: any, index: number) => ({
          id: t._id || t.id,
          customerId: t.customerId || customerId,
          projectId: t.projectId || projectId,
          serialNumber: index + 1, // FIX: Force sequential serials
          expenseType: t.expenseType || 'LABOUR_CHARGES',
          quantity: t.quantity || undefined,
          debitAmount: t.debitAmount || 0,
          creditAmount: t.creditAmount || 0,
          description: t.description || '',
          transactionDate: t.transactionDate || t.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
          createdAt: t.createdAt || new Date().toISOString()
        }));
      }
      
      if (mongoTransactions.length > 0) {
        // Sync to LocalStorage as backup with correct serials
        storage.saveTransactions(mongoTransactions);
        setTransactions(mongoTransactions);
        setLoading(false);
        return;
      }
      
      // Fallback to LocalStorage
      const loadedTransactions = storage.getCustomerTransactions(customerId, projectId);
      
      // FIX: Ensure sequential serial numbers
      const normalizedTransactions = loadedTransactions.map((t, index) => ({
        ...t,
        serialNumber: index + 1 // Force sequential
      }));
      
      // Save normalized transactions back
      storage.saveTransactions(normalizedTransactions);
      
      setTransactions(normalizedTransactions);
      
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback
      const loadedTransactions = storage.getCustomerTransactions(customerId, projectId);
      const normalizedTransactions = loadedTransactions.map((t, index) => ({
        ...t,
        serialNumber: index + 1
      }));
      setTransactions(normalizedTransactions);
    } finally {
      setLoading(false);
    }
  };

  // Save transaction to MongoDB AND LocalStorage
  const saveTransactionToMongoDB = async (transaction: Transaction) => {
    try {
      const transactionData = {
        customerId: transaction.customerId,
        projectId: transaction.projectId,
        serialNumber: transaction.serialNumber,
        expenseType: transaction.expenseType,
        quantity: transaction.quantity,
        debitAmount: transaction.debitAmount,
        creditAmount: transaction.creditAmount,
        description: transaction.description,
        transactionDate: transaction.transactionDate,
        createdAt: transaction.createdAt
      };
      
      let response;
      
      if (transaction.id && !transaction.id.startsWith('temp-')) {
        // Update existing transaction
        response = await transactionApi.update(transaction.id, transactionData);
      } else {
        // Create new transaction
        response = await transactionApi.create(transactionData);
      }
      
      return response.data || response;
    } catch (error) {
      console.error('Failed to save transaction to MongoDB:', error);
      throw error;
    }
  };

  // FIX: Update the createNewTransaction function to get correct serial:
  const createNewTransaction = (): Transaction => {
    const storedTransactions = storage.getCustomerTransactions(customerId, projectId);
    
    let nextSerial = 1;
    if (storedTransactions.length > 0) {
      // FIX: Get max serial number from stored transactions
      const maxSerial = Math.max(...storedTransactions.map(t => t.serialNumber));
      nextSerial = maxSerial + 1;
    }
    
    return {
      id: `temp-${Date.now()}`,
      customerId,
      projectId,
      serialNumber: nextSerial,
      expenseType: 'LABOUR_CHARGES',
      quantity: undefined,
      debitAmount: 0,
      creditAmount: 0,
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    let totalTransactions = 0;

    transactions.forEach(transaction => {
      totalDebit += transaction.debitAmount || 0;
      totalCredit += transaction.creditAmount || 0;
      totalTransactions++;
    });

    const balance = totalCredit - totalDebit;
    
    return {
      totalDebit,
      totalCredit,
      balance,
      totalTransactions,
      isProfit: balance >= 0
    };
  };

  const totals = calculateTotals();

  const handleAddTransaction = () => {
    const newTransaction = createNewTransaction();
    
    setTransactions([...transactions, newTransaction]);
    setEditingId(newTransaction.id);
    setIsAdding(true);
    
    setTimeout(() => {
      const element = document.getElementById(`transaction-${newTransaction.id}`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleUpdateTransaction = (id: string, field: keyof Transaction, value: any) => {
    const updatedTransactions = transactions.map(transaction => {
      if (transaction.id === id) {
        const config = expenseConfig[transaction.expenseType];
        
        if (field === 'expenseType') {
          const newConfig = expenseConfig[value as ExpenseType];
          return {
            ...transaction,
            [field]: value,
            quantity: newConfig.hasQuantity ? transaction.quantity : undefined,
            creditAmount: newConfig.isCreditOnly ? transaction.creditAmount : 0,
            debitAmount: newConfig.isCreditOnly ? 0 : transaction.debitAmount
          };
        }
        
        if (field === 'creditAmount' && transaction.expenseType !== 'INVESTMENT') {
          return transaction;
        }
        
        if (field === 'debitAmount' && transaction.expenseType === 'INVESTMENT') {
          return transaction;
        }
        
        if (field === 'quantity' && transaction.expenseType === 'LABOUR_CHARGES') {
          const rate = 500;
          const debit = (value || 0) * rate;
          return { ...transaction, quantity: value, debitAmount: debit };
        }
        
        if (field === 'quantity' && transaction.expenseType === 'COW_GOAT_DUNG') {
          const rate = 1000;
          const debit = (value || 0) * rate;
          return { ...transaction, quantity: value, debitAmount: debit };
        }
        
        return { ...transaction, [field]: value };
      }
      return transaction;
    });
    
    setTransactions(updatedTransactions);
  };

  // UPDATED: Save transaction to MongoDB AND LocalStorage
  const handleSaveTransaction = async (id: string) => {
    setSaveStatus('saving');
    
    try {
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) return;
      
      const config = expenseConfig[transaction.expenseType];
      
      if (config.isCreditOnly && transaction.debitAmount > 0) {
        showNotification('error', 'Investment can only have credit amount!');
        setSaveStatus('error');
        return;
      }
      
      if (!config.isCreditOnly && transaction.creditAmount > 0) {
        showNotification('error', 'Only Investment can have credit amount!');
        setSaveStatus('error');
        return;
      }
      
      // Save to MongoDB first
      const mongoResponse = await saveTransactionToMongoDB(transaction);
      console.log('MongoDB save response:', mongoResponse);
      
      // Update transaction with MongoDB ID if new
      let updatedTransaction = transaction;
      if (transaction.id.startsWith('temp-') && mongoResponse) {
        updatedTransaction = {
          ...transaction,
          id: mongoResponse._id || mongoResponse.id || transaction.id
        };
      }
      
      // Save to LocalStorage as backup
      const existingInStorage = storage.getCustomerTransactions(customerId, projectId)
        .some(t => t.id === id);
      
      if (existingInStorage) {
        storage.updateTransaction(updatedTransaction);
      } else {
        const storedTransactions = storage.getCustomerTransactions(customerId, projectId);
        let nextSerial = 1;
        
        if (storedTransactions.length > 0) {
          const maxSerial = Math.max(...storedTransactions.map(t => t.serialNumber));
          nextSerial = maxSerial + 1;
        }
        
        const transactionToSave = {
          ...updatedTransaction,
          serialNumber: nextSerial
        };
        storage.addTransaction(transactionToSave);
      }
      
      // Update state
      setTransactions(transactions.map(t => 
        t.id === id ? updatedTransaction : t
      ));
      
      setEditingId('');
      setIsAdding(false);
      setSaveStatus('saved');
      showNotification('success', 'Transaction saved successfully to database!');
      
      if (onTransactionsChange) {
        onTransactionsChange();
      }
      
    } catch (error) {
      console.error('Error saving transaction:', error);
      setSaveStatus('error');
      showNotification('error', 'Failed to save transaction to database. Saved locally only.');
      
      // Fallback: Save to LocalStorage only
      const transaction = transactions.find(t => t.id === id);
      if (transaction) {
        const existingInStorage = storage.getCustomerTransactions(customerId, projectId)
          .some(t => t.id === id);
        
        if (existingInStorage) {
          storage.updateTransaction(transaction);
        } else {
          storage.addTransaction(transaction);
        }
        
        showNotification('success', 'Transaction saved locally only.');
      }
    }
  };

  // FIX: Update the handleDeleteTransaction function with proper serial number recalculation:
  const handleDeleteTransaction = async (id: string) => {
    if (transactions.length === 0) return;
    
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      const transaction = transactions.find(t => t.id === id);
      
      // Delete from MongoDB if it has a real ID (not temp-)
      if (transaction && !transaction.id.startsWith('temp-')) {
        try {
          await transactionApi.delete(transaction.id);
          console.log('Deleted from MongoDB:', transaction.id);
        } catch (mongoError) {
          console.error('Failed to delete from MongoDB:', mongoError);
        }
      }
      
      // Delete from LocalStorage
      const existingInStorage = storage.getCustomerTransactions(customerId, projectId)
        .some(t => t.id === id);
      
      if (existingInStorage) {
        storage.deleteTransaction(id);
      }
      
      // Remove from state
      const updatedTransactions = transactions.filter(t => t.id !== id);
      
      // FIX: Recalculate serial numbers properly - 1, 2, 3...
      const renumberedTransactions = updatedTransactions.map((t, index) => ({
        ...t,
        serialNumber: index + 1 // Always sequential from 1
      }));
      
      // Update state with corrected serial numbers
      setTransactions(renumberedTransactions);
      
      // Update LocalStorage with new serials
      renumberedTransactions.forEach(t => {
        if (!t.id.startsWith('temp-')) {
          // Also update in LocalStorage with correct serial
          const existing = storage.getCustomerTransactions(customerId, projectId)
            .find(stored => stored.id === t.id);
          if (existing) {
            storage.updateTransaction({
              ...existing,
              serialNumber: t.serialNumber
            });
          }
        }
      });
      
      showNotification('success', 'Transaction deleted successfully!');
      
      if (onTransactionsChange) {
        onTransactionsChange();
      }
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      showNotification('error', 'Failed to delete transaction');
    }
  };

  const handleSaveAll = async () => {
    if (transactions.length === 0) {
      showNotification('error', 'No transactions to save');
      return;
    }
    
    setSaveStatus('saving');
    
    try {
      // Save all transactions to MongoDB
      for (const transaction of transactions) {
        if (!transaction.id.startsWith('temp-')) {
          await saveTransactionToMongoDB(transaction);
        }
      }
      
      // Save all to LocalStorage
      const storedTransactions = storage.getCustomerTransactions(customerId, projectId);
      
      transactions.forEach((transaction, index) => {
        if (transaction.id.startsWith('temp-')) {
          const transactionToSave = {
            ...transaction,
            serialNumber: index + 1
          };
          storage.addTransaction(transactionToSave);
        } else {
          storage.updateTransaction(transaction);
        }
      });
      
      setSaveStatus('saved');
      showNotification('success', 'All transactions saved successfully to database!');
      
      // Reload transactions
      loadTransactions();
      
      if (onTransactionsChange) {
        onTransactionsChange();
      }
      
    } catch (error) {
      console.error('Error saving all transactions:', error);
      setSaveStatus('error');
      showNotification('error', 'Failed to save all transactions to database. Saved locally only.');
      
      // Fallback: Save to LocalStorage only
      transactions.forEach((transaction, index) => {
        if (transaction.id.startsWith('temp-')) {
          const transactionToSave = {
            ...transaction,
            serialNumber: index + 1
          };
          storage.addTransaction(transactionToSave);
        } else {
          storage.updateTransaction(transaction);
        }
      });
    }
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      showNotification('error', 'No transactions to export');
      return;
    }
    
    const headers = ['S.No', 'Date', 'Expense Type', 'Quantity', 'Unit', 'Debit', 'Credit', 'Remarks'];
    const csvData = transactions.map(t => {
      const config = expenseConfig[t.expenseType];
      return [
        t.serialNumber,
        t.transactionDate,
        config.label,
        t.quantity || '',
        config.unit || '',
        t.debitAmount,
        t.creditAmount,
        t.description || ''
      ];
    });
    
    const csv = [headers, ...csvData].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${customerName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    showNotification('success', 'Exported successfully as CSV!');
  };

  const expenseTypeOptions = Object.entries(expenseConfig).map(([key, config]) => ({
    value: key,
    label: config.label,
    hasQuantity: config.hasQuantity,
    unit: config.unit,
    isCreditOnly: config.isCreditOnly
  }));

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Expense & Transaction Management</h2>
            <p className="text-gray-600">Add, edit, and track all expenses and investments</p>
            <p className="text-sm text-blue-600 mt-1">Project ID: {projectId}</p>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExportCSV}
              disabled={transactions.length === 0}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={handleSaveAll}
              disabled={saveStatus === 'saving' || transactions.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saveStatus === 'saving' ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <Save className="w-5 h-5" />
              )}
              Save All to Database
            </button>
          </div>
        </div>

        {notification && (
          <div className={`mb-4 p-3 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}
      </div>

      {transactions.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-200 mb-6">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">S.No</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Expense Type</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Quantity</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Debit Amount (₹)</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Credit Amount (₹)</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Remarks</th>
                  <th className="p-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {transactions.map((transaction) => {
                  const config = expenseConfig[transaction.expenseType];
                  const isEditing = editingId === transaction.id;
                  
                  return (
                    <tr 
                      key={transaction.id} 
                      id={`transaction-${transaction.id}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        isEditing ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="p-4">
                        <div className="font-medium text-gray-800">
                          {transaction.serialNumber}
                        </div>
                      </td>
                      
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="date"
                            value={transaction.transactionDate}
                            onChange={(e) => handleUpdateTransaction(transaction.id, 'transactionDate', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        ) : (
                          <div className="text-gray-700">
                            {new Date(transaction.transactionDate).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric'
                            })}
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        {isEditing ? (
                          <select
                            value={transaction.expenseType}
                            onChange={(e) => handleUpdateTransaction(transaction.id, 'expenseType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 bg-white"
                          >
                            {expenseTypeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="font-medium text-gray-800">{config.label}</div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        {config.hasQuantity ? (
                          isEditing ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={transaction.quantity || ''}
                                onChange={(e) => handleUpdateTransaction(transaction.id, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="0"
                                min="0"
                                step="1"
                              />
                              <span className="text-sm text-gray-500 whitespace-nowrap">{config.unit}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{transaction.quantity || 0}</span>
                              <span className="text-sm text-gray-500">{config.unit}</span>
                            </div>
                          )
                        ) : (
                          <span className="text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      
                      <td className="p-4">
                        {isEditing ? (
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={transaction.debitAmount || ''}
                              onChange={(e) => handleUpdateTransaction(transaction.id, 'debitAmount', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              disabled={config.isCreditOnly}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4 text-red-600" />
                            <span className={`font-medium ${transaction.debitAmount > 0 ? 'text-red-700' : 'text-gray-500'}`}>
                              {transaction.debitAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        {isEditing ? (
                          <div className="relative">
                            <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type="number"
                              value={transaction.creditAmount || ''}
                              onChange={(e) => handleUpdateTransaction(transaction.id, 'creditAmount', parseFloat(e.target.value) || 0)}
                              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              disabled={!config.isCreditOnly}
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className={`font-medium ${transaction.creditAmount > 0 ? 'text-green-700' : 'text-gray-500'}`}>
                              {transaction.creditAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        {isEditing ? (
                          <input
                            type="text"
                            value={transaction.description || ''}
                            onChange={(e) => handleUpdateTransaction(transaction.id, 'description', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Add Remarks..."
                          />
                        ) : (
                          <div className="text-gray-600 max-w-xs truncate" title={transaction.description || ''}>
                            {transaction.description || '-'}
                          </div>
                        )}
                      </td>
                      
                      <td className="p-4">
                        <div className="flex gap-2">
                          {isEditing ? (
                            <>
                              <button
                                onClick={() => handleSaveTransaction(transaction.id)}
                                disabled={saveStatus === 'saving'}
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                title="Save"
                              >
                                {saveStatus === 'saving' ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Save className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId('');
                                  setIsAdding(false);
                                  if (isAdding) {
                                    setTransactions(transactions.filter(t => t.id !== transaction.id));
                                  }
                                }}
                                className="p-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                                title="Cancel"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditingId(transaction.id)}
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteTransaction(transaction.id)}
                                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex justify-center">
            <button
              onClick={handleAddTransaction}
              className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add New Transaction Row
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Financial Summary
            </h3>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-700">Total Transactions</h4>
                    <p className="text-xs text-gray-500">All entries</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-gray-800">
                      {totals.totalTransactions}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Total Expenses</h4>
                    <p className="text-xs text-red-600">Debit Amount</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IndianRupee className="w-5 h-5 text-red-600" />
                      <span className="text-2xl font-bold text-red-700">
                        {totals.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-green-800">Total Investments</h4>
                    <p className="text-xs text-green-600">Credit Amount</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IndianRupee className="w-5 h-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-700">
                        {totals.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className={`p-4 rounded-lg ${totals.isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-800">Current Balance</h4>
                    <p className="text-xs text-gray-600">Net position</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      <IndianRupee className="w-5 h-5" />
                      <span className={`text-2xl font-bold ${totals.isProfit ? 'text-green-700' : 'text-red-700'}`}>
                        {Math.abs(totals.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      {totals.isProfit ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${totals.isProfit ? 'text-green-600' : 'text-red-600'}`}>
                        {totals.isProfit ? 'Profit' : 'Loss'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calculator className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Transactions Yet</h3>
          <p className="text-gray-500 mb-6">Start by adding your first transaction</p>
          <button
            onClick={handleAddTransaction}
            className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add First Transaction
          </button>
        </div>
      )}
    </div>
  );
};

export default ExpenseTable;