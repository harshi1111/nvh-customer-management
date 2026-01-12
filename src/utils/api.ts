// src/utils/api.ts
const API_BASE_URL = 'https://nvh-customer-management.onrender.com/api';

// Generic API request helper
async function apiRequest<T>(
  endpoint: string,
  method: string = 'GET',
  data?: any
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  // Add authorization header if token exists
  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Customer API
export const customerApi = {
  // Get all customers
  getAll: (search?: string, status?: string) => 
    apiRequest<any>(`/customers?search=${search || ''}&status=${status || 'all'}`),
  
  // Get customer by ID
  getById: (id: string) => 
    apiRequest<any>(`/customers/${id}`),
  
  // Create customer
  create: (customerData: any) => 
    apiRequest<any>('/customers', 'POST', customerData),
  
  // Update customer
  update: (id: string, customerData: any) => 
    apiRequest<any>(`/customers/${id}`, 'PUT', customerData),
  
  // Delete customer
  delete: (id: string) => 
    apiRequest<any>(`/customers/${id}`, 'DELETE'),
  
  // Toggle status
  toggleStatus: (id: string) => 
    apiRequest<any>(`/customers/${id}/toggle-status`, 'PATCH'),
  
  // Get financial summary
  getFinancialSummary: (id: string, projectId?: string) => 
    apiRequest<any>(`/customers/${id}/financial-summary?projectId=${projectId || ''}`),
};

// Project API
export const projectApi = {
  // Get customer projects
  getCustomerProjects: (customerId: string) => 
    apiRequest<any>(`/projects/customer/${customerId}`),
  
  // Get project by ID
  getById: (id: string) => 
    apiRequest<any>(`/projects/${id}`),
  
  // Create project
  create: (projectData: any) => 
    apiRequest<any>('/projects', 'POST', projectData),
  
  // Update project
  update: (id: string, projectData: any) => 
    apiRequest<any>(`/projects/${id}`, 'PUT', projectData),
  
  // Delete project
  delete: (id: string) => 
    apiRequest<any>(`/projects/${id}`, 'DELETE'),
};

// Transaction API
export const transactionApi = {
  // Get customer transactions
  getCustomerTransactions: (customerId: string, projectId?: string) => 
    apiRequest<any>(`/transactions/customer/${customerId}?projectId=${projectId || ''}`),
  
  // Get transaction by ID
  getById: (id: string) => 
    apiRequest<any>(`/transactions/${id}`),
  
  // Create transaction
  create: (transactionData: any) => 
    apiRequest<any>('/transactions', 'POST', transactionData),
  
  // Update transaction
  update: (id: string, transactionData: any) => 
    apiRequest<any>(`/transactions/${id}`, 'PUT', transactionData),
  
  // Delete transaction
  delete: (id: string) => 
    apiRequest<any>(`/transactions/${id}`, 'DELETE'),
  
  // Get next serial number
  getNextSerialNumber: (customerId: string, projectId: string) => 
    apiRequest<any>(`/transactions/next-serial/${customerId}/${projectId}`),
};