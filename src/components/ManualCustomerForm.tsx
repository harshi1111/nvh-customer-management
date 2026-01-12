// src/components/ManualCustomerForm.tsx - Updated with validation
import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { storage } from '../utils/storage';
import { validateAadhaar, isDuplicateAadhaar } from '../utils/security';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  X,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface ManualCustomerFormProps {
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  initialCustomer?: Customer;
}

const ManualCustomerForm: React.FC<ManualCustomerFormProps> = ({
  onSave,
  onCancel,
  initialCustomer
}) => {
  const [formData, setFormData] = useState({
    fullName: initialCustomer?.fullName || '',
    aadhaarNumber: initialCustomer?.aadhaarNumber || '',
    gender: initialCustomer?.gender || 'Male',
    dateOfBirth: initialCustomer?.dateOfBirth?.split('T')[0] || '',
    address: initialCustomer?.address || '',
    contactNumber: initialCustomer?.contactNumber || '',
    email: initialCustomer?.email || '',
    profileImage: initialCustomer?.profileImage || '',
    isActive: initialCustomer?.isActive !== undefined ? initialCustomer.isActive : true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [memberSince, setMemberSince] = useState(
    initialCustomer?.createdAt ? initialCustomer.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]
  );

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 3) {
      newErrors.fullName = 'Full name must be at least 3 characters';
    }
    
    // Aadhaar validation
    if (!formData.aadhaarNumber.trim()) {
      newErrors.aadhaarNumber = 'Aadhaar number is required';
    } else if (!validateAadhaar(formData.aadhaarNumber)) {
      newErrors.aadhaarNumber = 'Invalid Aadhaar number (must be 12 digits)';
    } else {
      // Check for duplicate Aadhaar (only for new customers or if Aadhaar changed)
      const customers = storage.getCustomers();
      if (!initialCustomer || initialCustomer.aadhaarNumber !== formData.aadhaarNumber) {
        if (isDuplicateAadhaar(customers, formData.aadhaarNumber)) {
          newErrors.aadhaarNumber = 'Aadhaar number already exists';
        }
      }
    }
    
    // Contact Number validation
    if (!formData.contactNumber.trim()) {
      newErrors.contactNumber = 'Contact number is required';
    } else if (!/^\d{10}$/.test(formData.contactNumber.replace(/[\s-]/g, ''))) {
      newErrors.contactNumber = 'Contact number must be 10 digits';
    }
    
    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    // Date of Birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      if (dob > today) {
        newErrors.dateOfBirth = 'Date of birth cannot be in the future';
      }
    }
    
    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    const customer: Customer = {
      id: initialCustomer?.id || Date.now().toString(),
      aadhaarNumber: formData.aadhaarNumber,
      fullName: formData.fullName.trim(),
      gender: formData.gender as 'Male' | 'Female' | 'Other',
      dateOfBirth: formData.dateOfBirth,
      address: formData.address.trim(),
      contactNumber: formData.contactNumber,
      email: formData.email.trim(),
      createdAt: initialCustomer?.createdAt || new Date(memberSince).toISOString(),
      profileImage: formData.profileImage || undefined,
      isActive: formData.isActive
    };
    
    onSave(customer);
    setIsSubmitting(false);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handlePhoneChange = (value: string) => {
    // Allow only digits and limit to 10
    const digits = value.replace(/\D/g, '').slice(0, 10);
    handleChange('contactNumber', digits);
  };

  const handleAadhaarChange = (value: string) => {
    // Allow only digits and limit to 12, add space after every 4 digits
    const digits = value.replace(/\D/g, '').slice(0, 12);
    const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ');
    handleChange('aadhaarNumber', formatted);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">
            {initialCustomer ? 'Edit Customer' : 'Add New Customer'}
          </h3>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={formData.fullName}
                onChange={(e) => handleChange('fullName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.fullName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter full name"
              />
              {errors.fullName && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.fullName}
                </p>
              )}
            </div>
            
            {/* Aadhaar Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Aadhaar Number *
              </label>
              <input
                type="text"
                value={formData.aadhaarNumber}
                onChange={(e) => handleAadhaarChange(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="XXXX XXXX XXXX"
                maxLength={14}
              />
              {errors.aadhaarNumber ? (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.aadhaarNumber}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Format: 12 digits (XXXX XXXX XXXX)
                </p>
              )}
            </div>
            
            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.dateOfBirth}
                </p>
              )}
            </div>
          </div>
          
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Number *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                  <span className="text-gray-500">🇮🇳 +91</span>
                </div>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`w-full pl-16 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                    errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                />
              </div>
              {errors.contactNumber ? (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.contactNumber}
                </p>
              ) : (
                <p className="mt-1 text-sm text-gray-500">
                  Format: 10 digits without country code
                </p>
              )}
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" /> {errors.email}
                </p>
              )}
            </div>
          </div>
          
          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address *
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              rows={3}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 ${
                errors.address ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter complete address"
            />
            {errors.address && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {errors.address}
              </p>
            )}
          </div>
          
          {/* Member Since (only for editing) */}
          {initialCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Member Since
              </label>
              <input
                type="date"
                value={memberSince}
                onChange={(e) => setMemberSince(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                max={new Date().toISOString().split('T')[0]}
              />
              <p className="mt-1 text-sm text-gray-500">
                Date when customer joined your service
              </p>
            </div>
          )}
          
          {/* Status */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleChange('isActive', e.target.checked.toString())}
                className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
              />
              <span className="text-sm font-medium text-gray-700">Active Customer</span>
            </label>
            <p className="mt-1 text-sm text-gray-500">
              Inactive customers won't appear in regular lists
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex-1 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  {initialCustomer ? 'Update Customer' : 'Create Customer'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualCustomerForm;