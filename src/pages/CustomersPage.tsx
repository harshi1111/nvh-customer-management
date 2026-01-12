import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../types';
import { Search, Plus, Filter, User, CheckCircle, XCircle, Edit, Users, Trash2 } from 'lucide-react'; // Add Trash2
import CustomerCard from '../components/CustomerCard';
import ManualCustomerForm from '../components/ManualCustomerForm';
import AadhaarUpload from '../components/AadhaarUpload';
import { storage } from '../utils/storage';

const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Load customers from localStorage on initial render
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const savedCustomers = storage.getCustomers();
    return savedCustomers.map((customer: any) => ({
      ...customer,
      // Ensure proper types
      gender: customer.gender as 'Male' | 'Female' | 'Other',
      isActive: customer.isActive !== undefined ? customer.isActive : true
    }));
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showAadhaarUpload, setShowAadhaarUpload] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Handle new customer creation
  const handleCustomerCreated = (customerData: any) => {
    if (editingCustomer) {
      // Update existing customer
      const updatedCustomer: Customer = {
        ...editingCustomer,
        aadhaarNumber: customerData.aadhaarNumber,
        fullName: customerData.fullName,
        gender: customerData.gender,
        dateOfBirth: customerData.dateOfBirth,
        address: customerData.address,
        contactNumber: customerData.contactNumber,
        email: customerData.email
      };
      
      // Update in localStorage
      const updatedCustomers = storage.updateCustomer(updatedCustomer);
      
      // Update state
      setCustomers(updatedCustomers);
      setSelectedCustomer(updatedCustomer);
      setEditingCustomer(null);
    } else {
      // Create new customer
      const newCustomer: Customer = {
        id: Date.now().toString(),
        aadhaarNumber: customerData.aadhaarNumber,
        fullName: customerData.fullName,
        gender: customerData.gender,
        dateOfBirth: customerData.dateOfBirth,
        address: customerData.address,
        contactNumber: customerData.contactNumber,
        email: customerData.email,
        createdAt: new Date().toISOString().split('T')[0],
        isActive: true,
        projects: [] // Add empty projects array
      };
      
      // Add to localStorage
      const updatedCustomers = storage.addCustomer(newCustomer);
      
      // Update state
      setCustomers(updatedCustomers);
      setSelectedCustomer(newCustomer);
    }
    
    setShowCustomerForm(false);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowCustomerForm(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customerId: string) => {
    // Delete customer from storage (this should also delete their transactions)
    const updatedCustomers = storage.getCustomers().filter(c => c.id !== customerId);
    storage.saveCustomers(updatedCustomers);
    
    // Also delete customer's transactions from storage
    storage.deleteCustomerTransactions(customerId);
    
    // Also delete customer's projects
    const allProjects = storage.loadProjects();
    const updatedProjects = allProjects.filter(p => p.customerId !== customerId);
    storage.saveProjects(updatedProjects);
    
    // Update state
    setCustomers(updatedCustomers);
    
    // If the deleted customer was selected, clear selection
    if (selectedCustomer && selectedCustomer.id === customerId) {
      setSelectedCustomer(null);
    }
    
    // Show success message
    alert('Customer deleted successfully!');
  };

  // Handle view transactions (navigate to accounting)
  const handleViewTransactions = (customerId: string) => {
    navigate(`/accounting/${customerId}`);
  };

  // Toggle customer active/inactive status
  const toggleCustomerStatus = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    if (customer) {
      const updatedCustomer = {
        ...customer,
        isActive: !customer.isActive
      };
      
      // Update in localStorage
      storage.updateCustomer(updatedCustomer);
      
      // Update state
      const updatedCustomers = customers.map(c => 
        c.id === customerId ? updatedCustomer : c
      );
      setCustomers(updatedCustomers);
      
      // Update selected customer if it's the one being toggled
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(updatedCustomer);
      }
    }
  };

  // Filter customers based on search AND status
  const filteredCustomers = customers.filter(customer => {
    // Search filter
    const matchesSearch = 
      customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.contactNumber.includes(searchTerm) ||
      customer.aadhaarNumber.includes(searchTerm);
    
    // Status filter
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && customer.isActive) ||
      (filterStatus === 'inactive' && !customer.isActive);
    
    return matchesSearch && matchesStatus;
  });

  // Filter Menu Component
  const FilterMenu = () => (
    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
      <div className="p-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-800">Filter by Status</h3>
      </div>
      <div className="p-2 space-y-1">
        <button
          onClick={() => {
            setFilterStatus('all');
            setShowFilterMenu(false);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            filterStatus === 'all'
              ? 'bg-green-50 text-green-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>All Customers</span>
          </div>
        </button>
        
        <button
          onClick={() => {
            setFilterStatus('active');
            setShowFilterMenu(false);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            filterStatus === 'active'
              ? 'bg-green-50 text-green-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span>Active Only</span>
          </div>
        </button>
        
        <button
          onClick={() => {
            setFilterStatus('inactive');
            setShowFilterMenu(false);
          }}
          className={`w-full text-left px-3 py-2 rounded-lg text-sm ${
            filterStatus === 'inactive'
              ? 'bg-green-50 text-green-700 font-medium'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-gray-400"></div>
            <span>Inactive Only</span>
          </div>
        </button>
      </div>
      
      {/* Clear filter */}
      {filterStatus !== 'all' && (
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={() => {
              setFilterStatus('all');
              setShowFilterMenu(false);
            }}
            className="w-full text-center text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );

  // Close filter when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFilterMenu && !(event.target as Element).closest('.filter-container')) {
        setShowFilterMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header and Stats Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
            <p className="text-gray-600 mt-1">Manage your customer database</p>
          </div>
          
          {/* Customer Stats - Moved to top right */}
          {customers.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Total Customers</p>
                    <p className="text-2xl font-bold text-gray-800">{customers.length}</p>
                  </div>
                  <Users className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Active</p>
                    <p className="text-2xl font-bold text-green-600">
                      {customers.filter(c => c.isActive).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-green-600 font-bold">✓</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">Inactive</p>
                    <p className="text-2xl font-bold text-gray-600">
                      {customers.filter(c => !c.isActive).length}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-bold">✗</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Panel - Customer List */}
          <div className="lg:w-2/5">
            <div className="bg-white rounded-lg shadow-sm p-4">
              {/* Search and Actions */}
              <div className="mb-6">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search customers by name, phone, or Aadhaar..."
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  {/* Filter Button with dropdown */}
                  <div className="relative filter-container">
                    <button 
                      className="px-4 py-3 border border-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-50 min-w-[100px]"
                      onClick={() => setShowFilterMenu(!showFilterMenu)}
                    >
                      <Filter className="w-5 h-5" />
                      <span>Filter</span>
                      {filterStatus !== 'all' && (
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      )}
                    </button>
                    
                    {showFilterMenu && <FilterMenu />}
                  </div>
                </div>

                {/* Filter Status Display */}
                {filterStatus !== 'all' && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-sm text-gray-600">Showing:</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {filterStatus === 'active' ? 'Active Customers' : 'Inactive Customers'}
                    </span>
                    <button
                      onClick={() => setFilterStatus('all')}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      × Clear
                    </button>
                  </div>
                )}

                {/* Filter Stats */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div>
                      Showing <span className="font-medium">{filteredCustomers.length}</span> of{' '}
                      <span className="font-medium">{customers.length}</span> customers
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span>Active: {customers.filter(c => c.isActive).length}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                        <span>Inactive: {customers.filter(c => !c.isActive).length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Creation Options */}
                <div className="space-y-3">
                  {/* Aadhaar OCR Button */}
                  <button 
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
                    onClick={() => {
                      setEditingCustomer(null);
                      setShowAadhaarUpload(true);
                    }}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Scan Aadhaar Card
                  </button>

                  {/* Manual Entry Button */}
                  <button 
                    className="w-full py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-green-50 transition-colors text-sm sm:text-base"
                    onClick={() => {
                      setEditingCustomer(null);
                      setShowCustomerForm(true);
                    }}
                  >
                    <Plus className="w-5 h-5" />
                    <span className="whitespace-nowrap">Add Manually</span>
                  </button>
                </div>
              </div>

              {/* Customer List */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {filteredCustomers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No customers found</p>
                    <p className="text-sm mt-1">
                      {customers.length === 0 
                        ? 'Add your first customer to get started' 
                        : 'Try changing your search or filter criteria'}
                    </p>
                  </div>
                ) : (
                  filteredCustomers.map((customer) => (
                    <div 
                      key={customer.id} 
                      onClick={() => setSelectedCustomer(customer)}
                      className={`cursor-pointer ${selectedCustomer?.id === customer.id ? 'ring-2 ring-green-500' : ''}`}
                    >
                      <CustomerCard
                        customer={customer}
                        onEdit={handleEditCustomer}
                        onDelete={handleDeleteCustomer} // Pass delete handler
                        onViewTransactions={handleViewTransactions}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Customer Details OR Empty State */}
          <div className="lg:w-3/5">
            {selectedCustomer ? (
              <div className="space-y-6">
                {/* Customer Details Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-800">{selectedCustomer.fullName}</h2>
                      <p className="text-gray-600">Customer ID: {selectedCustomer.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button 
                        onClick={() => toggleCustomerStatus(selectedCustomer.id)}
                        className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 ${
                          selectedCustomer.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {selectedCustomer.isActive ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4" />
                            Inactive
                          </>
                        )}
                      </button>
                      <button 
                        onClick={() => handleEditCustomer(selectedCustomer)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                      >
                        <Edit className="w-4 h-4" />
                        Edit Profile
                      </button>
                      <button 
                        onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                      <button 
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                        onClick={() => navigate(`/accounting/${selectedCustomer.id}`)}
                      >
                        View Accounting
                      </button>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Number</label>
                        <p className="mt-1 font-medium">{selectedCustomer.contactNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Email Address</label>
                        <p className="mt-1 font-medium">{selectedCustomer.email || 'Not provided'}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Gender & DOB</label>
                        <p className="mt-1 font-medium">
                          {selectedCustomer.gender} • {selectedCustomer.dateOfBirth}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Member Since</label>
                        <p className="mt-1 font-medium">{selectedCustomer.createdAt}</p>
                      </div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="pt-6 border-t border-gray-200">
                    <label className="text-sm font-medium text-gray-500">Address</label>
                    <p className="mt-2 text-gray-800">{selectedCustomer.address}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <User className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-medium text-gray-700 mb-2">No Customer Selected</h3>
                  <p className="text-gray-500 mb-6">
                    {customers.length === 0 
                      ? 'Add your first customer to get started' 
                      : 'Select a customer from the list to view details'}
                  </p>
                  <div className="space-y-3">
                    <button 
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-medium hover:from-green-700 hover:to-emerald-700"
                      onClick={() => setShowAadhaarUpload(true)}
                    >
                      Scan Aadhaar Card
                    </button>
                    <button 
                      className="w-full px-6 py-3 border-2 border-green-600 text-green-600 rounded-lg font-medium hover:bg-green-50"
                      onClick={() => {
                        setEditingCustomer(null);
                        setShowCustomerForm(true);
                      }}
                    >
                      Add Manually
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Manual Customer Form Modal */}
        {showCustomerForm && (
          <ManualCustomerForm
            initialCustomer={editingCustomer || undefined}
            onSave={handleCustomerCreated}
            onCancel={() => {
              setShowCustomerForm(false);
              setEditingCustomer(null);
            }}
          />
        )}

        {/* Aadhaar Upload Modal */}
        {showAadhaarUpload && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="relative w-full max-w-4xl">
              <AadhaarUpload
                onDataExtracted={(data) => {
                  // Create customer from extracted data
                  const newCustomer: Customer = {
                    id: Date.now().toString(),
                    aadhaarNumber: data.aadhaarNumber || '',
                    fullName: data.fullName || '',
                    gender: (data.gender as 'Male' | 'Female' | 'Other') || 'Male',
                    dateOfBirth: data.dateOfBirth || '',
                    address: data.address || '',
                    contactNumber: data.contactNumber || '',
                    email: data.email || '',
                    createdAt: new Date().toISOString().split('T')[0],
                    isActive: true,
                    projects: [] // Add empty projects array
                  };
                  
                  // Add to localStorage
                  const updatedCustomers = storage.addCustomer(newCustomer);
                  
                  // Update state
                  setCustomers(updatedCustomers);
                  setSelectedCustomer(newCustomer);
                  setShowAadhaarUpload(false);
                }}
                onCancel={() => setShowAadhaarUpload(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersPage;