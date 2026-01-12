// src/types/index.ts

// For location API - we'll use a free API like CountriesNow
export interface Country {
  country: string;
}

export interface State {
  name: string;
  state_code?: string;
}

export interface City {
  name: string;
}

// Add Project interface
export interface Project {
  id: string;
  customerId: string;
  name: string; // e.g., "Project 1", "Project 2"
  location: {
    country: string;
    state: string;
    city: string;
    village: string;
  };
  numberOfBags: number;
  area: {
    value: number;
    unit: 'acres' | 'cent';
  };
  status: 'active' | 'completed' | 'planned';
  createdAt: string;
  updatedAt: string;
}

// Expense Type
export type ExpenseType = 
  | 'LABOUR_CHARGES'
  | 'SPRINKLER_INSTALLATION'
  | 'TRANSPORT'
  | 'FOOD'
  | 'PLOUGHING'
  | 'TRACTOR'
  | 'COW_GOAT_DUNG'
  | 'INVESTMENT';

// Update Transaction to include projectId
export interface Transaction {
  id: string;
  customerId: string;
  projectId: string; // This is now REQUIRED - every transaction belongs to a project
  serialNumber: number;
  expenseType: ExpenseType;
  quantity?: number;
  unit?: string;
  debitAmount: number;
  creditAmount: number;
  description?: string;
  transactionDate: string;
  createdAt: string;
}

// Update Customer to include projects array
export interface Customer {
  id: string;
  aadhaarNumber: string;
  fullName: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  address: string;
  contactNumber: string;
  email: string;
  createdAt: string;
  profileImage?: string;
  isActive: boolean;
  projects?: Project[]; // Add projects array
}

// Expense Configuration
export interface ExpenseConfig {
  [key: string]: {
    label: string;
    hasQuantity: boolean;
    unit?: string;
    isCreditOnly?: boolean;
  };
}

export const expenseConfig: ExpenseConfig = {
  LABOUR_CHARGES: { label: 'Labour Charges', hasQuantity: true, unit: 'labourers' },
  SPRINKLER_INSTALLATION: { label: 'Sprinkler Installation', hasQuantity: false },
  TRANSPORT: { label: 'Transport', hasQuantity: false },
  FOOD: { label: 'Food', hasQuantity: false },
  PLOUGHING: { label: 'Ploughing', hasQuantity: false },
  TRACTOR: { label: 'Tractor', hasQuantity: false },
  COW_GOAT_DUNG: { label: 'Cow & Goat Dung', hasQuantity: true, unit: 'Maatu Vandi' },
  INVESTMENT: { label: 'Investment', hasQuantity: false, isCreditOnly: true }
};

export {};