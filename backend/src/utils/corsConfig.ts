export const getCorsOrigins = (): string[] => {
  const origins: string[] = [];
  
  // Production frontend URL
  if (process.env.PRODUCTION_FRONTEND_URL) {
    origins.push(process.env.PRODUCTION_FRONTEND_URL);
  } else {
    origins.push('https://nvh-customer-management.vercel.app');
  }
  
  // Backend URL
  if (process.env.BACKEND_URL) {
    origins.push(process.env.BACKEND_URL);
  } else {
    origins.push('https://nvh-customer-management-s3yn-4zmxhccyf-harshi1111s-projects.vercel.app');
  }
  
  // Development URLs
  if (process.env.NODE_ENV !== 'production') {
    origins.push('http://localhost:3000');
    origins.push('http://localhost:5173');
  }
  
  // Add any custom origins from env
  if (process.env.CORS_ORIGINS) {
    const customOrigins = process.env.CORS_ORIGINS.split(',');
    origins.push(...customOrigins.map(url => url.trim()));
  }
  
  return Array.from(new Set(origins.filter(Boolean))); // Remove duplicates and empty values
};

export const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = getCorsOrigins();
    
    // Allow requests with no origin
    if (!origin) {
      return callback(null, true);
    }
    
    // Check exact matches
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Check Vercel preview deployments - FIXED PATTERN
    // Matches: https://nvh-customer-management-XXXX-XXXX.harshi1111.vercel.app
    // Or: https://nvh-customer-management-XXXX-XXXX-harshi1111s-projects.vercel.app
    const vercelPatterns = [
      /^https:\/\/nvh-customer-management(-[\w-]+)*\.vercel\.app$/,
      /^https:\/\/nvh-customer-management(-[\w-]+)*-harshi1111s-projects\.vercel\.app$/,
      /^https:\/\/nvh-customer-management(-[\w-]+)*\.harshi1111\.vercel\.app$/
    ];
    
    if (vercelPatterns.some(pattern => pattern.test(origin))) {
      return callback(null, true);
    }
    
    // Also allow any .vercel.app domain for your project (safest for now)
    if (origin.includes('nvh-customer-management') && origin.endsWith('.vercel.app')) {
      console.log(`Allowing Vercel preview: ${origin}`);
      return callback(null, true);
    }
    
    console.warn(`CORS blocked: ${origin}. Allowed origins:`, allowedOrigins);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400
};

export const handleCorsError = (req: any, res: any, error: Error) => {
  const origin = req.headers.origin;
  
  // Set CORS headers even for errors
  if (origin && origin.includes('nvh-customer-management') && origin.endsWith('.vercel.app')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  return res.status(403).json({
    error: 'CORS Error',
    message: 'Origin not allowed',
    suggestion: 'Ensure your frontend URL is a valid Vercel deployment'
  });
};