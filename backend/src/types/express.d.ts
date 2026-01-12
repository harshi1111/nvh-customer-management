import { ICustomer } from '../models/Customer';

declare global {
  namespace Express {
    interface Request {
      customer?: ICustomer;
    }
  }
}