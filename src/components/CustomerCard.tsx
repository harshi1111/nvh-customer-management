// src/components/CustomerCard.tsx - UPDATED WITH DEBUG LOGS
import React, { useState } from 'react';
import { Customer } from '../types';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  Edit2,
  Save,
  X,
  Trash2
} from 'lucide-react';

interface CustomerCardProps {
  customer: Customer;
  onEdit: (customer: Customer) => void;
  onDelete: (customerId: string) => void;
  onViewTransactions: (customerId: string) => void;
}

const CustomerCard: React.FC<CustomerCardProps> = ({
  customer,
  onEdit,
  onDelete,
  onViewTransactions
}) => {
  const [isEditingMemberSince, setIsEditingMemberSince] = useState(false);
  const [memberSince, setMemberSince] = useState(customer.createdAt.split('T')[0]);

  const handleSaveMemberSince = () => {
    const updatedCustomer = {
      ...customer,
      createdAt: new Date(memberSince).toISOString()
    };
    onEdit(updatedCustomer);
    setIsEditingMemberSince(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${customer.fullName}? This will also delete all their projects and transactions!`)) {
      onDelete(customer.id);
    }
  };

  const handleViewAccounting = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    console.log('🚀 CustomerCard: View Accounting clicked!');
    console.log('📋 Customer ID:', customer.id);
    console.log('👤 Customer Name:', customer.fullName);
    console.log('🔗 Will navigate to:', `/accounting/${customer.id}`);
    
    // Check if onViewTransactions function exists
    if (typeof onViewTransactions === 'function') {
      console.log('✅ onViewTransactions is a function, calling it...');
      onViewTransactions(customer.id);
    } else {
      console.error('❌ onViewTransactions is NOT a function!', onViewTransactions);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Customer Header */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-white rounded-full border-4 border-white shadow-sm flex items-center justify-center">
              {customer.profileImage ? (
                <img 
                  src={customer.profileImage} 
                  alt={customer.fullName}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-8 h-8 text-green-600" />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{customer.fullName}</h3>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  customer.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {customer.isActive ? 'Active' : 'Inactive'}
                </span>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  {isEditingMemberSince ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={memberSince}
                        onChange={(e) => setMemberSince(e.target.value)}
                        className="px-2 py-1 border border-gray-300 rounded text-sm"
                      />
                      <button
                        onClick={handleSaveMemberSince}
                        className="p-1 bg-green-600 text-white rounded"
                      >
                        <Save className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setIsEditingMemberSince(false)}
                        className="p-1 bg-gray-300 text-gray-700 rounded"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <span>
                        {new Date(customer.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsEditingMemberSince(true);
                        }}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(customer);
              }}
              className="p-2 text-gray-600 hover:bg-white hover:text-green-600 rounded-lg transition-colors"
              title="Edit Customer"
            >
              <Edit2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 text-gray-600 hover:bg-white hover:text-red-600 rounded-lg transition-colors"
              title="Delete Customer"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="p-6">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Phone className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-medium text-gray-800">{customer.contactNumber}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-medium text-gray-800">{customer.email || 'Not provided'}</div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-gray-600" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Address</div>
              <div className="font-medium text-gray-800">{customer.address}</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={handleViewAccounting}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            View Accounting
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerCard;