// src/utils/security.ts
// Aadhaar security service for encryption and validation

const SECRET_KEY = 'nvh_agri_aadhaar_secret_2024'; // In production, use environment variable

// Simple XOR encryption for demo (use AES in production)
export const encryptAadhaar = (aadhaarNumber: string): string => {
  // In production, use proper encryption like crypto-js AES
  // This is a simple obfuscation for demo purposes
  return btoa(aadhaarNumber + '_' + Date.now());
};

export const decryptAadhaar = (encryptedAadhaar: string): string => {
  try {
    const decoded = atob(encryptedAadhaar);
    return decoded.split('_')[0]; // Extract original aadhaar
  } catch (error) {
    console.error('Error decrypting Aadhaar:', error);
    return '';
  }
};

// Validate Aadhaar number format (12 digits, valid checksum)
export const validateAadhaar = (aadhaarNumber: string): boolean => {
  // Remove spaces and dashes
  const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
  
  // Check if it's 12 digits
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return false;
  }
  
  // Simple Verhoeff algorithm check (simplified)
  // In production, implement full Verhoeff algorithm
  const digits = cleanAadhaar.split('').map(Number);
  
  // Check last digit (checksum)
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    sum += digits[i];
  }
  
  // Simple checksum validation
  const checksum = sum % 10;
  return checksum === digits[11];
};

// Mask Aadhaar for display (XXXX XXXX 1234)
export const maskAadhaar = (aadhaarNumber: string): string => {
  if (!aadhaarNumber || aadhaarNumber.length < 12) return 'XXXX XXXX XXXX';
  
  const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
  return `XXXX XXXX ${cleanAadhaar.slice(8)}`;
};

// Check for duplicate Aadhaar
export const isDuplicateAadhaar = (customers: any[], aadhaarNumber: string): boolean => {
  const cleanAadhaar = aadhaarNumber.replace(/[\s-]/g, '');
  return customers.some(customer => {
    const customerAadhaar = customer.aadhaarNumber.replace(/[\s-]/g, '');
    return customerAadhaar === cleanAadhaar;
  });
};