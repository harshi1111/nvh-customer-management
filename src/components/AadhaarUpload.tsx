import React, { useState, useCallback, useEffect } from 'react';
import { Upload, Scan, FileText, User, Calendar, MapPin, AlertCircle, CheckCircle2, X, Phone, Mail } from 'lucide-react';
import { extractAadhaarData, ExtractedAadhaarData } from '../utils/aadhaarOCR';
import { scanQRFromImage, parseAadhaarQR, AadhaarQRData } from '../utils/qrScanner';
import { storage } from '../utils/storage';

interface AadhaarUploadProps {
  onDataExtracted: (data: ExtractedAadhaarData & { contactNumber?: string; email?: string }) => void;
  onCancel: () => void;
}

// Validation functions
const isValidPhoneNumber = (phone: string): boolean => {
  const cleaned = phone.replace(/\D/g, ''); // Remove non-digits
  console.log('Phone validation:', { phone, cleaned, length: cleaned.length });
  return cleaned.length === 10;
};

const isValidEmail = (email: string): boolean => {
  if (!email || email.trim() === '') return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/\D/g, '').slice(0, 10);
};

// Add this function for Aadhaar duplicate check - UPDATED TO CHECK MONGODB
const checkDuplicateAadhaar = async (aadhaarNumber: string): Promise<boolean> => {
  if (!aadhaarNumber) return false;
  
  try {
    // Check MongoDB via API
    const response = await fetch(
      `https://nvh-customer-management.onrender.com/api/customers?search=${aadhaarNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      return data.count > 0; // If count > 0, Aadhaar exists
    }
    return false;
  } catch (error) {
    console.error('Failed to check duplicate:', error);
    // Fallback to localStorage
    const customers = storage.getCustomers();
    const cleanAadhaar = aadhaarNumber.replace(/\s/g, '');
    
    return customers.some(customer => {
      const customerAadhaar = customer.aadhaarNumber.replace(/\s/g, '');
      return customerAadhaar === cleanAadhaar;
    });
  }
};

const AadhaarUpload: React.FC<AadhaarUploadProps> = ({ onDataExtracted, onCancel }) => {
  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedAadhaarData | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'upload' | 'review' | 'manual'>('upload');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{
    contactNumber?: string;
    email?: string;
    aadhaarDuplicate?: string;
  }>({});
  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form on every change
  useEffect(() => {
    const validateForm = async () => {
      const errors: { contactNumber?: string; email?: string; aadhaarDuplicate?: string } = {};
      let isValid = true;

      // Phone validation
      if (!contactNumber.trim()) {
        errors.contactNumber = 'Contact number is required';
        isValid = false;
      } else if (!isValidPhoneNumber(contactNumber)) {
        errors.contactNumber = 'Please enter a valid 10-digit phone number';
        isValid = false;
      }

      // Email validation
      if (email.trim() && !isValidEmail(email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }

      // Aadhaar duplicate check - UPDATED FOR ASYNC
      if (extractedData?.aadhaarNumber) {
        const isDuplicate = await checkDuplicateAadhaar(extractedData.aadhaarNumber);
        if (isDuplicate) {
          errors.aadhaarDuplicate = 'This Aadhaar number already exists in the system';
          isValid = false;
        }
      }

      // Additional checks for review step
      if (step === 'review' && extractedData) {
        if (!extractedData.aadhaarNumber || !extractedData.fullName) {
          isValid = false;
        }
      }

      // Additional checks for manual step
      if (step === 'manual') {
        if (!extractedData?.aadhaarNumber || !extractedData?.fullName) {
          isValid = false;
        }
      }

      setValidationErrors(errors);
      setIsFormValid(isValid);
    };

    validateForm();
  }, [contactNumber, email, extractedData, step]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size should be less than 5MB');
      return;
    }

    if (side === 'front') {
      setFrontImage(file);
    } else {
      setBackImage(file);
    }
    
    setError(null);
  }, []);

  // Process Aadhaar images
  const processAadhaar = async () => {
    if (!frontImage) {
      setError('Please upload front side of Aadhaar card');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Starting Aadhaar processing...');
      
      // STEP 1: Try QR scanning first
      console.log('Step 1: Attempting QR scan...');
      const qrData = await scanQRFromImage(frontImage);
      
      let extractedData: ExtractedAadhaarData = {};
      
      if (qrData) {
        console.log('QR data found!');
        const parsedQR = parseAadhaarQR(qrData);
        
        if (parsedQR) {
          console.log('QR parsed successfully:', parsedQR);
          
          extractedData = {
            aadhaarNumber: parsedQR.uid,
            fullName: parsedQR.name,
            gender: parsedQR.gender,
            dateOfBirth: parsedQR.dob || `01/01/${parsedQR.yob}`,
            address: parsedQR.address,
            confidence: 100
          };
          
          console.log('Data extracted from QR:', extractedData);
          
          if (extractedData.aadhaarNumber && extractedData.fullName) {
            // Check for duplicate Aadhaar immediately after extraction
            const isDuplicate = await checkDuplicateAadhaar(extractedData.aadhaarNumber);
            if (isDuplicate) {
              setError('This Aadhaar number already exists in the system. Please use a different Aadhaar or check existing customer.');
              setLoading(false);
              return;
            }
            
            setExtractedData(extractedData);
            setStep('review');
            setLoading(false);
            return;
          }
        }
      }
      
      // STEP 2: Fallback to OCR
      console.log('Step 2: Falling back to OCR...');
      const ocrData = await extractAadhaarData(frontImage, 'front');
      
      extractedData = {
        ...ocrData,
        ...extractedData,
        confidence: extractedData.confidence || ocrData.confidence
      };
      
      // STEP 3: Process back side for address
      if (backImage && !extractedData.address) {
        console.log('Step 3: Processing back side for address...');
        const backData = await extractAadhaarData(backImage, 'back');
        if (backData.address) {
          extractedData.address = backData.address;
        }
      }
      
      console.log('Final extracted data:', extractedData);
      
      // Check for duplicate Aadhaar after OCR extraction
      const isDuplicate = await checkDuplicateAadhaar(extractedData.aadhaarNumber || '');
      if (extractedData.aadhaarNumber && isDuplicate) {
        setError('This Aadhaar number already exists in the system. Please use a different Aadhaar or check existing customer.');
        setLoading(false);
        return;
      }
      
      setExtractedData(extractedData);
      setStep('review');

    } catch (err) {
      console.error('Processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process Aadhaar card. Please try again or enter details manually.');
      setStep('manual');
    } finally {
      setLoading(false);
    }
  };

  // Handle manual data entry submission
  const handleManualSubmit = async () => {
    if (!isFormValid) {
      return;
    }

    if (!extractedData?.aadhaarNumber) {
      setError('Aadhaar number is required');
      return;
    }

    // ADD DUPLICATE CHECK HERE
    const isDuplicate = await checkDuplicateAadhaar(extractedData.aadhaarNumber);
    if (isDuplicate) {
      setError('This Aadhaar number already exists in the system');
      return;
    }

    onDataExtracted({
      ...extractedData,
      contactNumber: formatPhoneNumber(contactNumber),
      email: email.trim() || undefined
    });
  };

  // Handle final submission
  const handleSubmit = async () => {
    if (!isFormValid) {
      return;
    }

    if (!extractedData?.aadhaarNumber || !extractedData?.fullName) {
      setError('Please ensure Aadhaar number and name are extracted correctly');
      return;
    }

    // ADD DUPLICATE CHECK HERE
    const isDuplicate = await checkDuplicateAadhaar(extractedData.aadhaarNumber);
    if (isDuplicate) {
      setError('This Aadhaar number already exists in the system');
      return;
    }

    onDataExtracted({
      ...extractedData,
      contactNumber: formatPhoneNumber(contactNumber),
      email: email.trim() || undefined
    });
  };

  // Reset everything
  const handleReset = () => {
    setFrontImage(null);
    setBackImage(null);
    setExtractedData(null);
    setStep('upload');
    setError(null);
    setContactNumber('');
    setEmail('');
    setValidationErrors({});
    setIsFormValid(false);
  };

  // Handle phone number input
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
    if (value.length <= 10) {
      setContactNumber(value);
    }
  };

  // Handle email input
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <Scan className="w-8 h-8 text-green-600" />
                Aadhaar Card Scan
              </h2>
              <p className="text-gray-600 mt-1">Upload Aadhaar card to auto-fill customer details</p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Front Side Upload */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Front Side</h3>
                    <p className="text-sm text-gray-600">Contains Name, Aadhaar Number, DOB, Gender</p>
                    <p className="text-xs text-green-600 mt-1">✓ QR code scanning will be attempted first</p>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-500 transition-colors">
                  <input
                    type="file"
                    id="front-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'front')}
                  />
                  
                  {frontImage ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <p className="font-medium text-green-700">{frontImage.name}</p>
                      <button
                        onClick={() => setFrontImage(null)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="front-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700 font-medium">Click to upload front side</p>
                      <p className="text-sm text-gray-500 mt-1">JPEG, PNG or PDF (Max 5MB)</p>
                      <p className="text-xs text-green-600 mt-2">Make sure QR code is clear and visible</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Back Side Upload (Optional) */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Back Side (Optional)</h3>
                    <p className="text-sm text-gray-600">Contains address details</p>
                  </div>
                </div>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="back-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, 'back')}
                  />
                  
                  {backImage ? (
                    <div className="space-y-3">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-8 h-8 text-blue-600" />
                      </div>
                      <p className="font-medium text-blue-700">{backImage.name}</p>
                      <button
                        onClick={() => setBackImage(null)}
                        className="text-sm text-red-600 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label htmlFor="back-upload" className="cursor-pointer">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-700">Click to upload back side</p>
                      <p className="text-sm text-gray-500 mt-1">Optional - for address extraction</p>
                    </label>
                  )}
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-medium">Error</p>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={onCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={processAadhaar}
                  disabled={!frontImage || loading}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex-1 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <Scan className="w-5 h-5" />
                      Scan & Extract Details
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {step === 'review' && extractedData && (
            <div className="space-y-6">
              <div className={`${extractedData.confidence === 100 ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'} border rounded-lg p-4`}>
                <div className="flex items-center gap-3">
                  {extractedData.confidence === 100 ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Scan className="w-5 h-5 text-blue-600" />
                  )}
                  <div>
                    <p className="font-medium text-gray-800">
                      {extractedData.confidence === 100 
                        ? '✓ Details extracted from QR code!' 
                        : 'Details extracted successfully!'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {extractedData.confidence === 100
                        ? 'QR data is 100% accurate. Please review and add contact information.'
                        : 'Please review and add missing information'}
                    </p>
                    {extractedData.confidence && extractedData.confidence < 100 && (
                      <p className="text-xs text-blue-600 mt-1">
                        Confidence level: {extractedData.confidence}%
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Aadhaar Duplicate Error */}
              {validationErrors.aadhaarDuplicate && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Duplicate Aadhaar Found</p>
                      <p className="text-sm text-red-600">{validationErrors.aadhaarDuplicate}</p>
                      <p className="text-xs text-red-500 mt-1">
                        If this customer has updated their Aadhaar, please use the Edit Profile option instead.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Extracted Details */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Aadhaar Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Number
                      {extractedData.confidence === 100 && (
                        <span className="ml-2 text-xs text-green-600">(from QR)</span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={extractedData.aadhaarNumber || ''}
                        onChange={(e) => setExtractedData({...extractedData, aadhaarNumber: e.target.value})}
                        className={`flex-1 px-4 py-2 border rounded-lg font-mono ${
                          validationErrors.aadhaarDuplicate ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="1234 5678 9012"
                        readOnly={extractedData.confidence === 100}
                      />
                      {extractedData.aadhaarNumber && extractedData.aadhaarNumber.length === 12 && !validationErrors.aadhaarDuplicate && (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                    {validationErrors.aadhaarDuplicate ? (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.aadhaarDuplicate}</p>
                    ) : extractedData.aadhaarNumber && extractedData.aadhaarNumber.length === 12 ? (
                      <p className="text-green-600 text-sm mt-1">✓ Valid 12-digit Aadhaar number</p>
                    ) : extractedData.aadhaarNumber && extractedData.aadhaarNumber.length > 0 ? (
                      <p className="text-yellow-600 text-sm mt-1">Enter {12 - extractedData.aadhaarNumber.length} more digits</p>
                    ) : null}
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                      {extractedData.confidence === 100 && (
                        <span className="ml-2 text-xs text-green-600">(from QR)</span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={extractedData.fullName || ''}
                        onChange={(e) => setExtractedData({...extractedData, fullName: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        readOnly={extractedData.confidence === 100}
                      />
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                      {extractedData.confidence === 100 && (
                        <span className="ml-2 text-xs text-green-600">(from QR)</span>
                      )}
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={extractedData.dateOfBirth || ''}
                        onChange={(e) => setExtractedData({...extractedData, dateOfBirth: e.target.value})}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="DD/MM/YYYY"
                        readOnly={extractedData.confidence === 100}
                      />
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Gender */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                      {extractedData.confidence === 100 && (
                        <span className="ml-2 text-xs text-green-600">(from QR)</span>
                      )}
                    </label>
                    <select
                      value={extractedData.gender || ''}
                      onChange={(e) => setExtractedData({...extractedData, gender: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      disabled={extractedData.confidence === 100}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                    {extractedData.confidence === 100 && extractedData.address && (
                      <span className="ml-2 text-xs text-green-600">(from QR)</span>
                    )}
                  </label>
                  <textarea
                    value={extractedData.address || ''}
                    onChange={(e) => setExtractedData({...extractedData, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Address extracted from back side of Aadhaar"
                    readOnly={extractedData.confidence === 100 && !!extractedData.address}
                  />
                </div>

                {/* Manual Fields with Validation */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Contact Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                      <span className="ml-2 text-xs text-red-600">(required)</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={handlePhoneChange}
                        className={`w-full px-4 py-2 border rounded-lg ${validationErrors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="9876543210"
                        maxLength={10}
                      />
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    {validationErrors.contactNumber ? (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.contactNumber}</p>
                    ) : contactNumber.length === 10 ? (
                      <p className="text-green-600 text-sm mt-1">✓ Valid 10-digit number</p>
                    ) : contactNumber.length > 0 ? (
                      <p className="text-yellow-600 text-sm mt-1">Enter {10 - contactNumber.length} more digits</p>
                    ) : null}
                    <p className="text-xs text-gray-500 mt-1">10-digit Indian mobile number</p>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full px-4 py-2 border rounded-lg ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="customer@example.com"
                      />
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                    {email && !validationErrors.email && isValidEmail(email) && (
                      <p className="text-green-600 text-sm mt-1">✓ Valid email format</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">Optional - for communication</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Upload Again
                </button>
                <button
                  onClick={() => setStep('manual')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Enter Manually
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!isFormValid || !!validationErrors.aadhaarDuplicate}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Customer
                </button>
              </div>
            </div>
          )}

          {step === 'manual' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">Enter Details Manually</p>
                    <p className="text-sm text-yellow-600">OCR extraction failed. Please enter details manually.</p>
                  </div>
                </div>
              </div>

              {/* Aadhaar Duplicate Error */}
              {validationErrors.aadhaarDuplicate && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Duplicate Aadhaar Found</p>
                      <p className="text-sm text-red-600">{validationErrors.aadhaarDuplicate}</p>
                      <p className="text-xs text-red-500 mt-1">
                        If this customer has updated their Aadhaar, please use the Edit Profile option instead.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Manual Form with Validation */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Number *
                    </label>
                    <input
                      type="text"
                      value={extractedData?.aadhaarNumber || ''}
                      onChange={(e) => setExtractedData({...extractedData, aadhaarNumber: e.target.value})}
                      className={`w-full px-4 py-2 border rounded-lg ${
                        validationErrors.aadhaarDuplicate ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="1234 5678 9012"
                      required
                    />
                    {validationErrors.aadhaarDuplicate ? (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.aadhaarDuplicate}</p>
                    ) : extractedData?.aadhaarNumber && extractedData.aadhaarNumber.length === 12 ? (
                      <p className="text-green-600 text-sm mt-1">✓ Valid 12-digit Aadhaar number</p>
                    ) : extractedData?.aadhaarNumber && extractedData.aadhaarNumber.length > 0 ? (
                      <p className="text-yellow-600 text-sm mt-1">Enter {12 - extractedData.aadhaarNumber.length} more digits</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={extractedData?.fullName || ''}
                      onChange={(e) => setExtractedData({...extractedData, fullName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Number *
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="tel"
                        value={contactNumber}
                        onChange={handlePhoneChange}
                        className={`w-full px-4 py-2 border rounded-lg ${validationErrors.contactNumber ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="9876543210"
                        maxLength={10}
                        required
                      />
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    {validationErrors.contactNumber ? (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.contactNumber}</p>
                    ) : contactNumber.length === 10 ? (
                      <p className="text-green-600 text-sm mt-1">✓ Valid 10-digit number</p>
                    ) : contactNumber.length > 0 ? (
                      <p className="text-yellow-600 text-sm mt-1">Enter {10 - contactNumber.length} more digits</p>
                    ) : null}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        className={`w-full px-4 py-2 border rounded-lg ${validationErrors.email ? 'border-red-500' : 'border-gray-300'}`}
                        placeholder="customer@example.com"
                      />
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    {validationErrors.email && (
                      <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                    )}
                    {email && !validationErrors.email && isValidEmail(email) && (
                      <p className="text-green-600 text-sm mt-1">✓ Valid email format</p>
                    )}
                  </div>
                </div>

                {/* Other fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={extractedData?.dateOfBirth || ''}
                      onChange={(e) => setExtractedData({...extractedData, dateOfBirth: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="DD/MM/YYYY"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      value={extractedData?.gender || ''}
                      onChange={(e) => setExtractedData({...extractedData, gender: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={extractedData?.address || ''}
                    onChange={(e) => setExtractedData({...extractedData, address: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Full address"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-6 border-t">
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Try OCR Again
                </button>
                <button
                  onClick={handleManualSubmit}
                  disabled={!isFormValid || !!validationErrors.aadhaarDuplicate}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Customer
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AadhaarUpload;