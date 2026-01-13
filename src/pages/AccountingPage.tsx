// pages/AccountingPage.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Customer, Project } from '../types';
import { storage } from '../utils/storage';
import { customerApi, projectApi } from '../utils/api';
import ExpenseTable from '../components/ExpenseTable';
import ProjectManagement from '../components/ProjectManagement';

import { 
  ArrowLeft, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Download,
  Printer,
  IndianRupee,
  CheckCircle,
  XCircle
} from 'lucide-react';

const AccountingPage: React.FC = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [customerSummary, setCustomerSummary] = useState({
    totalDebit: 0,
    totalCredit: 0,
    balance: 0,
    transactionCount: 0
  });

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId, navigate]);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      
      // 1. Try to load customer from MongoDB first
      console.log('Loading customer from MongoDB, ID:', customerId);
      const customerResponse = await customerApi.getById(customerId!);
      console.log('MongoDB customer response:', customerResponse);
      
      // FIX: Handle the nested response structure: data.customer
      const mongoCustomer = customerResponse.data?.customer || customerResponse.data || customerResponse;
      console.log('Extracted customer data:', mongoCustomer);
      
      if (mongoCustomer && mongoCustomer._id) {
        // Map MongoDB customer to frontend format
        const customerData: Customer = {
          id: mongoCustomer._id || mongoCustomer.id,
          aadhaarNumber: mongoCustomer.aadhaarNumber || '',
          fullName: mongoCustomer.fullName || '',
          gender: (mongoCustomer.gender as 'Male' | 'Female' | 'Other') || 'Male',
          dateOfBirth: mongoCustomer.dateOfBirth || '',
          address: mongoCustomer.address || '',
          contactNumber: mongoCustomer.contactNumber || '',
          email: mongoCustomer.email || '',
          profileImage: mongoCustomer.profileImage || '',
          createdAt: mongoCustomer.createdAt ? new Date(mongoCustomer.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          isActive: mongoCustomer.isActive !== undefined ? mongoCustomer.isActive : true,
          projects: mongoCustomer.projects || []
        };
        
        console.log('Mapped customer data:', customerData);
        setCustomer(customerData);
        
        // 2. Load projects for this customer
        let projects: Project[] = [];
        
        try {
          // Try to load projects from MongoDB
          const projectsResponse = await projectApi.getCustomerProjects(customerId!);
          console.log('MongoDB projects response:', projectsResponse);
          
          // Handle different response formats
          if (projectsResponse.data && Array.isArray(projectsResponse.data)) {
            projects = projectsResponse.data.map((proj: any) => ({
              id: proj._id || proj.id,
              customerId: proj.customerId || customerId!,
              name: proj.name || 'Project',
              location: proj.location || {
                country: 'India',
                state: 'Tamil Nadu',
                city: 'Chennai',
                village: 'Main Village'
              },
              numberOfBags: proj.numberOfBags || 0,
              area: proj.area || { value: 0, unit: 'acres' },
              status: proj.status || 'active',
              createdAt: proj.createdAt || new Date().toISOString(),
              updatedAt: proj.updatedAt || new Date().toISOString()
            }));
          } else if (Array.isArray(projectsResponse)) {
            projects = projectsResponse.map((proj: any) => ({
              id: proj._id || proj.id,
              customerId: proj.customerId || customerId!,
              name: proj.name || 'Project',
              location: proj.location || {
                country: 'India',
                state: 'Tamil Nadu',
                city: 'Chennai',
                village: 'Main Village'
              },
              numberOfBags: proj.numberOfBags || 0,
              area: proj.area || { value: 0, unit: 'acres' },
              status: proj.status || 'active',
              createdAt: proj.createdAt || new Date().toISOString(),
              updatedAt: proj.updatedAt || new Date().toISOString()
            }));
          }
        } catch (projectError) {
          console.error('Failed to load projects from MongoDB:', projectError);
          // Fallback to localStorage
          projects = storage.getCustomerProjects(customerId!);
        }
        
        console.log('Loaded projects:', projects);
        
        if (projects.length > 0) {
          setSelectedProjectId(projects[0].id);
          loadFinancialSummary(projects[0].id);
          
          // Migrate old transactions to use project system
          storage.migrateOldTransactions(customerId!, projects[0].id);
        } else {
          // Create a default project
          const defaultProject: Project = {
            id: Date.now().toString(),
            customerId: customerId!,
            name: 'Project 1',
            location: {
              country: 'India',
              state: 'Tamil Nadu',
              city: 'Chennai',
              village: 'Main Village'
            },
            numberOfBags: 0,
            area: {
              value: 0,
              unit: 'acres'
            },
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          // Try to save to MongoDB first
          try {
            const createdProject = await projectApi.create(defaultProject);
            const newProjectId = createdProject.data?.id || createdProject.data?._id || defaultProject.id;
            console.log('Created default project in MongoDB:', newProjectId);
            
            setSelectedProjectId(newProjectId);
            loadFinancialSummary(newProjectId);
          } catch (createError) {
            console.error('Failed to create project in MongoDB:', createError);
            // Fallback to localStorage
            storage.addProject(defaultProject);
            setSelectedProjectId(defaultProject.id);
            loadFinancialSummary(defaultProject.id);
          }
          
          // Migrate old transactions to use this project
          storage.migrateOldTransactions(customerId!, defaultProject.id);
        }
        
        setLoading(false);
        return;
      } else {
        console.error('Customer not found in MongoDB response or missing _id:', mongoCustomer);
      }
    } catch (error) {
      console.error('Failed to load customer from MongoDB:', error);
    }
    
    // 3. Fallback to localStorage if MongoDB fails
    console.log('Falling back to localStorage...');
    const loadedCustomer = storage.getCustomerById(customerId!);
    if (loadedCustomer) {
      console.log('Found customer in localStorage:', loadedCustomer.fullName);
      setCustomer(loadedCustomer);
      
      const projects = storage.getCustomerProjects(customerId!);
      
      if (projects.length > 0) {
        setSelectedProjectId(projects[0].id);
        loadFinancialSummary(projects[0].id);
        
        // Migrate old transactions to use project system
        storage.migrateOldTransactions(customerId!, projects[0].id);
      } else {
        // Create a default project in localStorage
        const defaultProject: Project = {
          id: Date.now().toString(),
          customerId: customerId!,
          name: 'Project 1',
          location: {
            country: 'India',
            state: 'Tamil Nadu',
            city: 'Chennai',
            village: 'Main Village'
          },
          numberOfBags: 0,
          area: {
            value: 0,
            unit: 'acres'
          },
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        storage.addProject(defaultProject);
        setSelectedProjectId(defaultProject.id);
        loadFinancialSummary(defaultProject.id);
        
        // Migrate old transactions to use this project
        storage.migrateOldTransactions(customerId!, defaultProject.id);
      }
    } else {
      console.log('Customer not found in localStorage either, navigating back');
      navigate('/customers');
    }
    
    setLoading(false);
  };

  // Function to reload financial summary when transactions change
  const reloadFinancialSummary = () => {
    if (customerId && selectedProjectId) {
      const summary = storage.getCustomerFinancialSummary(customerId, selectedProjectId);
      setCustomerSummary(summary);
    }
  };

  // Load financial summary for a specific project
  const loadFinancialSummary = (projectId: string) => {
    if (customerId) {
      // For now, use localStorage for transactions
      const summary = storage.getCustomerFinancialSummary(customerId, projectId);
      setCustomerSummary(summary);
    }
  };

  // Handle project selection
  const handleProjectSelect = (projectId: string) => {
    setSelectedProjectId(projectId);
    loadFinancialSummary(projectId);
  };

  // Toggle customer active/inactive status
  const toggleCustomerStatus = async () => {
    if (customer) {
      const updatedCustomer = {
        ...customer,
        isActive: !customer.isActive
      };
      
      try {
        // Update in MongoDB
        await customerApi.update(customer.id, { isActive: updatedCustomer.isActive });
        
        // Update local state
        setCustomer(updatedCustomer);
        
        // Also update localStorage as fallback
        storage.updateCustomer(updatedCustomer);
      } catch (error) {
        console.error('Failed to update status in MongoDB:', error);
        // Fallback to localStorage only
        storage.updateCustomer(updatedCustomer);
        setCustomer(updatedCustomer);
      }
    }
  };

  // Handle customer selection change (if we add dropdown)
  const handleCustomerChange = (selectedCustomerId: string) => {
    navigate(`/accounting/${selectedCustomerId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading customer data...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Customer Not Found</h2>
            <p className="text-gray-600 mb-6">The customer you're looking for doesn't exist or has been removed.</p>
            <Link 
              to="/customers" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Customers
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link 
              to="/customers"
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Accounting & Expenses</h1>
              <p className="text-gray-600">Manage expenses and investments for customers</p>
            </div>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Export
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex items-center gap-2">
              <Printer className="w-5 h-5" />
              Print
            </button>
          </div>
        </div>

        {/* Customer Summary Card */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Customer Header */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center">
                  <User className="w-8 h-8 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{customer.fullName}</h2>
                  <div className="flex items-center gap-4 mt-2">
                    <button 
                      onClick={toggleCustomerStatus}
                      className={`px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 transition-colors ${
                        customer.isActive 
                          ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                          : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                      }`}
                    >
                      {customer.isActive ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Active Customer
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Inactive Customer
                        </>
                      )}
                    </button>
                    <span className="text-sm text-gray-500">
                      Member since: {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Financial Summary */}
              <div className="bg-white rounded-lg p-4 shadow-sm min-w-[300px]">
                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Financial Summary
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Total Debit</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <IndianRupee className="w-4 h-4 text-red-600" />
                      <span className="text-xl font-bold text-red-700">
                        {customerSummary.totalDebit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Total Credit</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <IndianRupee className="w-4 h-4 text-green-600" />
                      <span className="text-xl font-bold text-green-700">
                        {customerSummary.totalCredit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">Balance</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <IndianRupee className="w-4 h-4" />
                      <span className={`text-xl font-bold ${
                        customerSummary.balance >= 0 ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {Math.abs(customerSummary.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className={`text-xs mt-1 ${customerSummary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {customerSummary.balance >= 0 ? 'Profit' : 'Loss'}
                    </div>
                  </div>
                </div>
                <div className="text-center mt-3 text-sm text-gray-500">
                  {customerSummary.transactionCount} transactions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Add Project Management Component */}
        <div className="bg-white rounded-xl shadow-sm p-1">
          <ProjectManagement
            customerId={customerId!}
            customerName={customer?.fullName || ''}
            onProjectSelect={handleProjectSelect}
            selectedProjectId={selectedProjectId}
          />
        </div>

        {/* Expense Table Section */}
        <div className="bg-white rounded-xl shadow-sm p-1">
          {selectedProjectId && (
            <ExpenseTable 
              customerId={customerId!}
              projectId={selectedProjectId}
              customerName={customer?.fullName || ''}
              onTransactionsChange={reloadFinancialSummary}
            />
          )}
        </div>

        {/* Quick Actions Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Last updated: {new Date().toLocaleDateString()}
          </div>
          <div className="flex gap-3">
            <Link 
              to="/customers"
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Back to Customers
            </Link>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountingPage;