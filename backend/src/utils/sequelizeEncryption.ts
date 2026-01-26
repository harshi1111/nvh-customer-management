import { AadhaarEncryption } from './encryption';

export const encryptAadhaar = (value: string): string => {
  if (!value) return value;
  
  const cleanValue = value.replace(/\s/g, '');
  
  if (/^\d{12}$/.test(cleanValue)) {
    return AadhaarEncryption.encrypt(cleanValue);
  }
  
  console.warn(`Storing invalid Aadhaar format: ${value.substring(0, 4)}...`);
  return AadhaarEncryption.encrypt(`INVALID-${cleanValue}`);
};

export const decryptAadhaar = (value: string): string => {
  if (!value) return value;
  
  try {
    const decrypted = AadhaarEncryption.decrypt(value);
    
    if (decrypted.startsWith('INVALID-')) {
      const original = decrypted.replace('INVALID-', '');
      return AadhaarEncryption.mask(original) + ' (Invalid Format)';
    }
    
    return AadhaarEncryption.mask(decrypted);
  } catch (error) {
    console.warn('Failed to decrypt Aadhaar, returning as-is');
    return value.length === 12 ? AadhaarEncryption.mask(value) : value;
  }
};

export const createAadhaarHash = (value: string): string | null => {
  if (!value) return null;
  
  const cleanAadhaar = value.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleanAadhaar)) {
    return null;
  }
  
  return require('crypto').createHash('sha256').update(cleanAadhaar).digest('hex');
};