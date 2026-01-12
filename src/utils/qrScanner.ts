// utils/qrScanner.ts

// Interface for Aadhaar QR XML data
export interface AadhaarQRData {
  uid: string;           // Aadhaar number
  name: string;          // Full name
  gender: string;        // M/F/T
  yob: string;          // Year of birth
  dob?: string;         // Date of birth (if available)
  co?: string;          // Care of
  house?: string;       // House number
  street?: string;      // Street
  loc?: string;         // Locality
  vtc?: string;         // Village/Town
  po?: string;          // Post Office
  dist?: string;        // District
  state?: string;       // State
  pc?: string;          // PIN Code
  address?: string;     // Formatted address
}

// Function to parse Aadhaar QR XML data
export const parseAadhaarQR = (qrData: string): AadhaarQRData | null => {
  try {
    console.log('QR Data received:', qrData.substring(0, 100) + '...');
    
    // Check if it's XML format
    if (!qrData.includes('<PrintLetterBarcodeData')) {
      console.log('Not an Aadhaar QR (missing XML tag)');
      return null;
    }
    
    // Extract XML attributes using regex (simpler than full XML parsing)
    const extractAttribute = (attrName: string): string | undefined => {
      const regex = new RegExp(`${attrName}="([^"]*)"`);
      const match = qrData.match(regex);
      return match ? match[1] : undefined;
    };
    
    const uid = extractAttribute('uid');
    const name = extractAttribute('name');
    const gender = extractAttribute('gender');
    const yob = extractAttribute('yob');
    const dob = extractAttribute('dob');
    const co = extractAttribute('co');
    const house = extractAttribute('house');
    const street = extractAttribute('street');
    const loc = extractAttribute('loc');
    const vtc = extractAttribute('vtc');
    const po = extractAttribute('po');
    const dist = extractAttribute('dist');
    const state = extractAttribute('state');
    const pc = extractAttribute('pc');
    
    // Validate required fields
    if (!uid || !name || !gender || !yob) {
      console.log('Missing required fields in QR data');
      return null;
    }
    
    // Format gender
    const genderMap: Record<string, string> = {
      'M': 'Male',
      'F': 'Female', 
      'T': 'Other'
    };
    
    const formattedGender = genderMap[gender] || 'Other';
    
    // Build address from components
    const addressParts: string[] = [];
    if (co) addressParts.push(co);
    if (house) addressParts.push(house);
    if (street) addressParts.push(street);
    if (loc) addressParts.push(loc);
    if (vtc) addressParts.push(vtc);
    if (po) addressParts.push(`PO: ${po}`);
    if (dist) addressParts.push(dist);
    if (state) addressParts.push(state);
    if (pc) addressParts.push(`PIN: ${pc}`);
    
    const address = addressParts.filter(Boolean).join(', ');
    
    // Format date of birth
    let formattedDOB = '';
    if (dob) {
      // dob is in DD/MM/YYYY format
      formattedDOB = dob;
    } else if (yob) {
      // Only year available
      formattedDOB = `01/01/${yob}`;
    }
    
    return {
      uid,
      name: name.toUpperCase(),
      gender: formattedGender,
      yob,
      dob: formattedDOB,
      co,
      house,
      street,
      loc,
      vtc,
      po,
      dist,
      state,
      pc,
      address
    };
    
  } catch (error) {
    console.error('QR Parsing Error:', error);
    return null;
  }
};

// Function to scan QR from image
export const scanQRFromImage = async (imageFile: File): Promise<string | null> => {
  return new Promise((resolve) => {
    const img = new Image();
    const reader = new FileReader();
    
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
        
        img.onload = () => {
          // Create canvas to get image data
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            console.log('Could not get canvas context');
            resolve(null);
            return;
          }
          
          // Set canvas size to image size
          canvas.width = img.width;
          canvas.height = img.height;
          
          // Draw image on canvas
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Get image data
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          // Try to load jsQR dynamically
          import('jsqr').then((jsQRModule) => {
            const jsQR = jsQRModule.default;
            
            console.log('Scanning QR code with jsQR...');
            
            // Scan for QR code
            const code = jsQR(
              imageData.data,
              imageData.width,
              imageData.height,
              {
                inversionAttempts: 'dontInvert',
              }
            );
            
            if (code) {
              console.log('QR Code found!');
              resolve(code.data);
            } else {
              console.log('No QR code found in image');
              resolve(null);
            }
          }).catch((error) => {
            console.log('jsQR failed to load:', error);
            resolve(null);
          });
        };
        
        img.onerror = () => {
          console.log('Error loading image');
          resolve(null);
        };
      }
    };
    
    reader.onerror = () => {
      console.log('Error reading file');
      resolve(null);
    };
    
    reader.readAsDataURL(imageFile);
  });
};