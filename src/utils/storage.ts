// utils/storage.ts
import { Customer, Transaction, Project } from '../types';

const CUSTOMERS_KEY = 'nvh_agri_customers';
const TRANSACTIONS_KEY = 'nvh_agri_transactions';
const PROJECTS_KEY = 'nvh_agri_projects'; // Add projects key

export const storage = {
  // ========== CUSTOMER OPERATIONS ==========
  
  // Save customers to localStorage
  saveCustomers: (customers: Customer[]): void => {
    localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(customers));
  },
  
  // Load customers from localStorage
  loadCustomers: (): Customer[] => {
    const data = localStorage.getItem(CUSTOMERS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  // Add a single customer
  addCustomer: (customer: Customer): Customer[] => {
    const customers = storage.loadCustomers();
    customers.push(customer);
    storage.saveCustomers(customers);
    return customers;
  },
  
  // Update an existing customer
  updateCustomer: (updatedCustomer: Customer): Customer[] => {
    const customers = storage.loadCustomers();
    const index = customers.findIndex(c => c.id === updatedCustomer.id);
    if (index !== -1) {
      customers[index] = updatedCustomer;
      storage.saveCustomers(customers);
    }
    return customers;
  },
  
  // Get a customer by ID
  getCustomerById: (id: string): Customer | undefined => {
    const customers = storage.loadCustomers();
    return customers.find(c => c.id === id);
  },
  
  // Get all customers
  getCustomers: (): Customer[] => {
    return storage.loadCustomers();
  },
  
  // Search customers by name, aadhaar, or phone
  searchCustomers: (searchTerm: string): Customer[] => {
    const customers = storage.loadCustomers();
    const term = searchTerm.toLowerCase();
    
    return customers.filter(customer =>
      customer.fullName.toLowerCase().includes(term) ||
      customer.aadhaarNumber.includes(term) ||
      customer.contactNumber.includes(term)
    );
  },
  
  // ========== PROJECT OPERATIONS ==========
  
  // Save all projects
  saveProjects: (projects: Project[]): void => {
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
  },
  
  // Load all projects
  loadProjects: (): Project[] => {
    const data = localStorage.getItem(PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  // Get projects for a specific customer
  getCustomerProjects: (customerId: string): Project[] => {
    const projects = storage.loadProjects();
    return projects
      .filter(p => p.customerId === customerId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },
  
  // Add a new project
  addProject: (project: Project): Project[] => {
    const projects = storage.loadProjects();
    projects.push(project);
    storage.saveProjects(projects);
    return projects;
  },
  
  // Update an existing project
  updateProject: (updatedProject: Project): Project[] => {
    const projects = storage.loadProjects();
    const index = projects.findIndex(p => p.id === updatedProject.id);
    
    if (index !== -1) {
      projects[index] = { ...updatedProject, updatedAt: new Date().toISOString() };
      storage.saveProjects(projects);
    }
    return projects;
  },
  
  // Delete a project and all its transactions
  deleteProject: (projectId: string): Project[] => {
    // First, delete all transactions for this project
    const transactions = storage.loadTransactions();
    const filteredTransactions = transactions.filter(t => t.projectId !== projectId);
    storage.saveTransactions(filteredTransactions);
    
    // Then delete the project
    const projects = storage.loadProjects();
    const filteredProjects = projects.filter(p => p.id !== projectId);
    storage.saveProjects(filteredProjects);
    
    return filteredProjects;
  },
  
  // Get a project by ID
  getProjectById: (projectId: string): Project | undefined => {
    const projects = storage.loadProjects();
    return projects.find(p => p.id === projectId);
  },

  // ========== MIGRATION OPERATIONS ==========

  // Migrate old transactions (without projectId) to use project system
  migrateOldTransactions: (customerId: string, projectId: string): void => {
    const transactions = storage.loadTransactions();
    let migratedCount = 0;
    
    // Find transactions for this customer that don't have a projectId
    const transactionsToMigrate = transactions.filter(t => 
      t.customerId === customerId && !t.projectId
    );
    
    if (transactionsToMigrate.length > 0) {
      // Update each transaction with the projectId
      const updatedTransactions = transactions.map(t => {
        if (t.customerId === customerId && !t.projectId) {
          migratedCount++;
          return {
            ...t,
            projectId: projectId
          };
        }
        return t;
      });
      
      // Save updated transactions
      storage.saveTransactions(updatedTransactions);
      
      // Log migration (remove in production)
      console.log(`Migrated ${migratedCount} transactions to project: ${projectId}`);
    }
  },
  
  // ========== TRANSACTION OPERATIONS ==========
  
  // Save all transactions
  saveTransactions: (transactions: Transaction[]): void => {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  },
  
  // Load all transactions
  loadTransactions: (): Transaction[] => {
    const data = localStorage.getItem(TRANSACTIONS_KEY);
    return data ? JSON.parse(data) : [];
  },
  
  // Get transactions for a specific customer (optionally filtered by project)
  getCustomerTransactions: (customerId: string, projectId?: string): Transaction[] => {
    const transactions = storage.loadTransactions();
    let filteredTransactions = transactions.filter(t => t.customerId === customerId);
    
    if (projectId) {
      filteredTransactions = filteredTransactions.filter(t => t.projectId === projectId);
    }
    
    return filteredTransactions
      .sort((a, b) => a.serialNumber - b.serialNumber);
  },
  
  // Add a new transaction
  addTransaction: (transaction: Transaction): Transaction[] => {
    const transactions = storage.loadTransactions();
    transactions.push(transaction);
    storage.saveTransactions(transactions);
    return transactions;
  },
  
  // Update an existing transaction
  updateTransaction: (updatedTransaction: Transaction): Transaction[] => {
    const transactions = storage.loadTransactions();
    const index = transactions.findIndex(t => t.id === updatedTransaction.id);
    
    if (index !== -1) {
      transactions[index] = updatedTransaction;
      storage.saveTransactions(transactions);
    }
    return transactions;
  },
  
  // Delete a transaction
  deleteTransaction: (transactionId: string): Transaction[] => {
    const transactions = storage.loadTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== transactionId);
    storage.saveTransactions(filteredTransactions);
    return filteredTransactions;
  },
  
  // Get the next serial number for a customer (optionally for a specific project)
  getNextSerialNumber: (customerId: string, projectId?: string): number => {
    const customerTransactions = storage.getCustomerTransactions(customerId, projectId);
    if (customerTransactions.length === 0) return 1;
    
    const maxSerial = Math.max(...customerTransactions.map(t => t.serialNumber));
    return maxSerial + 1;
  },
  
  // Get financial summary for a customer (optionally filtered by project)
  getCustomerFinancialSummary: (customerId: string, projectId?: string) => {
    const transactions = storage.getCustomerTransactions(customerId, projectId);
    
    // Debug logging (remove in production)
    console.log(`Getting summary for customer ${customerId}:`, {
      transactionCount: transactions.length,
      transactions: transactions.map(t => ({ id: t.id, serial: t.serialNumber, projectId: t.projectId }))
    });
    
    let totalDebit = 0;
    let totalCredit = 0;
    
    transactions.forEach(transaction => {
      totalDebit += transaction.debitAmount || 0;
      totalCredit += transaction.creditAmount || 0;
    });
    
    const result = {
      totalDebit,
      totalCredit,
      balance: totalCredit - totalDebit,
      transactionCount: transactions.length
    };
    
    // Debug logging
    console.log('Financial summary result:', result);
    
    return result;
  },
  
  // Delete all transactions for a customer (when customer is deleted)
  deleteCustomerTransactions: (customerId: string): void => {
    const transactions = storage.loadTransactions();
    const filteredTransactions = transactions.filter(t => t.customerId !== customerId);
    storage.saveTransactions(filteredTransactions);
  }
};