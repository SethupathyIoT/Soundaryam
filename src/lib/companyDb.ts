// src/lib/companyDb.ts
import { openDB, DBSchema, IDBPDatabase } from "idb";
import {
  Company,
  Employee,
  EmployeeTransaction,
  EmployeeTransactionType,
} from "@/types/company";

interface CompaniesDB extends DBSchema {
  companies: {
    key: string;
    value: Company;
    indexes: {
      "by-name": string;
    };
  };
  employees: {
    key: string;
    value: Employee;
    indexes: {
      "by-companyId": string;
      "by-employeeCode": string;
    };
  };
  employeeTransactions: {
    key: string;
    value: EmployeeTransaction;
    indexes: {
      "by-employeeId": string;
      "by-createdAt": string;
    };
  };
  meta: {
    key: string;
    value: {
      key: string;
      value: number | string;
    };
  };
}

const DB_NAME = "RestaurantPOSCompaniesDB";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<CompaniesDB>> | null = null;

async function getCompaniesDB() {
  if (!dbPromise) {
    dbPromise = openDB<CompaniesDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Companies
        if (!db.objectStoreNames.contains("companies")) {
          const store = db.createObjectStore("companies", {
            keyPath: "id",
          });
          store.createIndex("by-name", "name", { unique: false });
        }

        // Employees
        if (!db.objectStoreNames.contains("employees")) {
          const store = db.createObjectStore("employees", {
            keyPath: "id",
          });
          store.createIndex("by-companyId", "companyId", { unique: false });
          store.createIndex("by-employeeCode", "employeeCode", { unique: true });
        }

        // Employee Transactions
        if (!db.objectStoreNames.contains("employeeTransactions")) {
          const store = db.createObjectStore("employeeTransactions", {
            keyPath: "id",
          });
          store.createIndex("by-employeeId", "employeeId", { unique: false });
          store.createIndex("by-createdAt", "createdAt", { unique: false });
        }

        // Meta (for counters etc.)
        if (!db.objectStoreNames.contains("meta")) {
          db.createObjectStore("meta", { keyPath: "key" });
        }
      },
    });
  }
  return dbPromise;
}

/* -------------------------------------------------------------------------- */
/*                           HELPER: UUID + COUNTER                           */
/* -------------------------------------------------------------------------- */

function createUUID() {
  return crypto.randomUUID();
}

async function getAndIncrementEmployeeCounter(): Promise<number> {
  const db = await getCompaniesDB();
  const tx = db.transaction("meta", "readwrite");
  const store = tx.objectStore("meta");

  const current = await store.get("employeeCounter");
  let value = 1;
  if (current && typeof current.value === "number") {
    value = current.value + 1;
  }

  await store.put({ key: "employeeCounter", value });
  await tx.done;
  return value;
}

function formatEmployeeCode(counter: number): string {
  return `EMP-${counter.toString().padStart(5, "0")}`;
}

/* -------------------------------------------------------------------------- */
/*                                  COMPANIES                                 */
/* -------------------------------------------------------------------------- */

export async function createCompany(input: {
  name: string;
  address?: string;
}): Promise<Company> {
  const db = await getCompaniesDB();
  const company: Company = {
    id: createUUID(),
    name: input.name.trim(),
    address: input.address?.trim() || "",
    createdAt: new Date().toISOString(),
  };
  await db.add("companies", company);
  return company;
}

export async function getCompanies(): Promise<Company[]> {
  const db = await getCompaniesDB();
  return db.getAll("companies");
}

export async function getCompanyById(id: string): Promise<Company | undefined> {
  const db = await getCompaniesDB();
  return db.get("companies", id);
}

/* -------------------------------------------------------------------------- */
/*                                  EMPLOYEES                                 */
/* -------------------------------------------------------------------------- */

export async function createEmployee(input: {
  companyId: string;
  name: string;
  phone?: string;
}): Promise<Employee> {
  const db = await getCompaniesDB();
  const counter = await getAndIncrementEmployeeCounter();
  const employeeCode = formatEmployeeCode(counter);

  const employee: Employee = {
    id: createUUID(),
    employeeCode,
    companyId: input.companyId,
    name: input.name.trim(),
    phone: input.phone?.trim() || "",
    activeBalance: 0,
    createdAt: new Date().toISOString(),
  };

  await db.add("employees", employee);
  return employee;
}

export async function getEmployeesByCompany(
  companyId: string
): Promise<Employee[]> {
  const db = await getCompaniesDB();
  return db.getAllFromIndex("employees", "by-companyId", companyId);
}

export async function getEmployeeById(
  id: string
): Promise<Employee | undefined> {
  const db = await getCompaniesDB();
  return db.get("employees", id);
}

export async function updateEmployee(employee: Employee): Promise<void> {
  const db = await getCompaniesDB();
  await db.put("employees", employee);
}

/* -------------------------------------------------------------------------- */
/*                           EMPLOYEE TRANSACTIONS                            */
/* -------------------------------------------------------------------------- */

export async function addEmployeeTransaction(input: {
  employeeId: string;
  type: EmployeeTransactionType;
  amount: number;
  description?: string;
}): Promise<EmployeeTransaction> {
  const db = await getCompaniesDB();

  // Always store positive amount, we decide sign in accounting logic
  const amount = Math.abs(input.amount);

  const tx = db.transaction(["employees", "employeeTransactions"], "readwrite");
  const employeeStore = tx.objectStore("employees");
  const txStore = tx.objectStore("employeeTransactions");

  const employee = await employeeStore.get(input.employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  // Update balance according to type
  if (input.type === "BILL") {
    employee.activeBalance += amount;
  } else if (input.type === "PAYMENT") {
    employee.activeBalance -= amount;
  }

  const transaction: EmployeeTransaction = {
    id: createUUID(),
    employeeId: input.employeeId,
    type: input.type,
    amount,
    description: input.description?.trim() || "",
    createdAt: new Date().toISOString(),
  };

  await employeeStore.put(employee);
  await txStore.add(transaction);

  await tx.done;

  return transaction;
}

export async function getEmployeeTransactions(
  employeeId: string
): Promise<EmployeeTransaction[]> {
  const db = await getCompaniesDB();
  const index = db
    .transaction("employeeTransactions")
    .store.index("by-employeeId");

  const all = await index.getAll(employeeId);

  // Sort by createdAt ascending for proper ledger
  return all.sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt)
  );
}

/* -------------------------------------------------------------------------- */
/*                              ACCOUNTING HELPERS                            */
/* -------------------------------------------------------------------------- */

export interface EmployeeAccountSummary {
  employee: Employee;
  transactions: (EmployeeTransaction & { runningBalance: number })[];
  totalBills: number;
  totalPayments: number;
  closingBalance: number;
}

export async function getEmployeeAccountSummary(
  employeeId: string
): Promise<EmployeeAccountSummary | null> {
  const db = await getCompaniesDB();
  const employee = await db.get("employees", employeeId);
  if (!employee) return null;

  const txs = await getEmployeeTransactions(employeeId);

  let running = 0;
  let totalBills = 0;
  let totalPayments = 0;

  const withRunning = txs.map((t) => {
    if (t.type === "BILL") {
      running += t.amount;
      totalBills += t.amount;
    } else if (t.type === "PAYMENT") {
      running -= t.amount;
      totalPayments += t.amount;
    }

    return {
      ...t,
      runningBalance: running,
    };
  });

  return {
    employee,
    transactions: withRunning,
    totalBills,
    totalPayments,
    closingBalance: running,
  };
}
