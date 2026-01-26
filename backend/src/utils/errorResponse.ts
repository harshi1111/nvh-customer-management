export class ErrorResponse extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const createErrorResponse = (message: string, statusCode: number = 500) => {
  return {
    success: false,
    error: message,
    statusCode
  };
};

export const handleControllerError = (error: any, res: any) => {
  console.error('Controller error:', error);
  
  // Set CORS headers for error responses
  const allowedOrigins = [
    'https://nvh-customer-management.vercel.app',
    'https://nvh-customer-management-4k5at189h-harshi1111s-projects.vercel.app',
    'http://localhost:3000',
    'http://localhost:5173'
  ];
  
  const origin = res.req?.headers?.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Rest of your error handling...
  if (error.name === 'ValidationError') {
    const messages = Object.values(error.errors).map((err: any) => err.message);
    return res.status(400).json(createErrorResponse(messages.join(', '), 400));
  }
  
  if (error.code === 11000) {
    return res.status(400).json(createErrorResponse('Duplicate entry found', 400));
  }
  
  if (error.statusCode) {
    return res.status(error.statusCode).json(createErrorResponse(error.message, error.statusCode));
  }
  
  return res.status(500).json(createErrorResponse('Server error', 500));
};