"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAadhaarHash = exports.decryptAadhaar = exports.encryptAadhaar = void 0;
const encryption_1 = require("./encryption");
const encryptAadhaar = (value) => {
    if (!value)
        return value;
    const cleanValue = value.replace(/\s/g, '');
    if (/^\d{12}$/.test(cleanValue)) {
        return encryption_1.AadhaarEncryption.encrypt(cleanValue);
    }
    console.warn(`Storing invalid Aadhaar format: ${value.substring(0, 4)}...`);
    return encryption_1.AadhaarEncryption.encrypt(`INVALID-${cleanValue}`);
};
exports.encryptAadhaar = encryptAadhaar;
const decryptAadhaar = (value) => {
    if (!value)
        return value;
    try {
        const decrypted = encryption_1.AadhaarEncryption.decrypt(value);
        if (decrypted.startsWith('INVALID-')) {
            const original = decrypted.replace('INVALID-', '');
            return encryption_1.AadhaarEncryption.mask(original) + ' (Invalid Format)';
        }
        return encryption_1.AadhaarEncryption.mask(decrypted);
    }
    catch (error) {
        console.warn('Failed to decrypt Aadhaar, returning as-is');
        return value.length === 12 ? encryption_1.AadhaarEncryption.mask(value) : value;
    }
};
exports.decryptAadhaar = decryptAadhaar;
const createAadhaarHash = (value) => {
    if (!value)
        return null;
    const cleanAadhaar = value.replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
        return null;
    }
    return require('crypto').createHash('sha256').update(cleanAadhaar).digest('hex');
};
exports.createAadhaarHash = createAadhaarHash;
