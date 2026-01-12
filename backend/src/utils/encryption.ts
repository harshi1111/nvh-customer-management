// src/utils/encryption.ts - Using Node.js built-in crypto
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
const ALGORITHM = 'aes-256-gcm';

if (!ENCRYPTION_KEY) {
  throw new Error('ENCRYPTION_KEY is required in .env file');
}

// Convert key to 32 bytes
const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

export class AadhaarEncryption {
  // Encrypt Aadhaar number
  static encrypt(plainText: string): string {
    try {
      // Generate random initialization vector
      const iv = crypto.randomBytes(16);
      
      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
      
      // Encrypt
      const encrypted = Buffer.concat([
        cipher.update(plainText, 'utf8'),
        cipher.final()
      ]);
      
      // Get auth tag
      const authTag = cipher.getAuthTag();
      
      // Combine iv + encrypted + authTag
      const result = Buffer.concat([iv, encrypted, authTag]);
      
      return result.toString('base64');
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt sensitive data');
    }
  }

  // Decrypt Aadhaar number
  static decrypt(encryptedText: string): string {
    try {
      // Convert from base64
      const buffer = Buffer.from(encryptedText, 'base64');
      
      // Extract parts
      const iv = buffer.slice(0, 16);
      const encrypted = buffer.slice(16, buffer.length - 16);
      const authTag = buffer.slice(buffer.length - 16);
      
      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);
      
      // Decrypt
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);
      
      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt sensitive data');
    }
  }

  // Mask Aadhaar for display (XXXX-XXXX-1234)
  static mask(aadhaarNumber: string): string {
    if (!aadhaarNumber || aadhaarNumber.length !== 12) {
      return 'Invalid Aadhaar';
    }
    return `XXXX-XXXX-${aadhaarNumber.slice(8)}`;
  }

  // Validate Aadhaar format
  static validate(aadhaarNumber: string): boolean {
    // Basic validation - 12 digits
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaarNumber);
  }

  // Hash for comparison (one-way, can't decrypt)
  static hash(aadhaarNumber: string): string {
    return crypto
      .createHash('sha256')
      .update(aadhaarNumber)
      .digest('hex');
  }
}