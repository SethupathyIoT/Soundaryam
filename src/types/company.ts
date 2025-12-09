// src/types/company.ts

export interface Company {
  id: string;             // internal UUID
  name: string;
  address?: string;
  createdAt: string;
}

export interface Employee {
  id: string;             // internal UUID
  employeeCode: string;   // visible ID, e.g. EMP-00001
  companyId: string;
  name: string;
  phone?: string;
  activeBalance: number;  // current due = bills - payments
  createdAt: string;
}

export type EmployeeTransactionType = "BILL" | "PAYMENT";

export interface EmployeeTransaction {
  id: string;
  employeeId: string;
  type: EmployeeTransactionType;  // BILL or PAYMENT
  amount: number;                 // always positive; sign decided by type
  description?: string;
  createdAt: string;
}
