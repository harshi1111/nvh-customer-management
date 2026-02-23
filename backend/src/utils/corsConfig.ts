export const getCorsOrigins = (): string[] => {
  return ['*']; // Allow all origins temporarily
};

export const corsOptions = {
  origin: getCorsOrigins(), 
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