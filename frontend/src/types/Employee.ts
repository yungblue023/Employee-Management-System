/**
 * TypeScript type definitions for Employee Management System
 * Based on our MongoDB data structure
 */

export interface Employee {
  _id?: string;
  employee_id: string;
  name: string;
  age: number;
  department: string;
  salary?: number;
  hire_date?: string;
  status?: EmployeeStatus;
  skills?: string[];
  files?: EmployeeAttachment[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  employee_id: string;
  name: string;
  age: number;
  department: string;
  salary?: number;
  hire_date?: string;
  status?: EmployeeStatus;
  skills?: string[];
}

export interface EmployeeUpdate {
  name?: string;
  age?: number;
  department?: string;
  salary?: number;
  hire_date?: string;
  status?: EmployeeStatus;
  skills?: string[];
}

export interface DashboardStats {
  total_employees: number;
  recent_employees: number;
  department_distribution: { [key: string]: number };
  salary_stats: {
    avg_salary: number;
    min_salary: number;
    max_salary: number;
    total_payroll: number;
  };
  age_demographics: AgeDemographic[];
  status_distribution: { [key: string]: number };
}

export interface AgeDemographic {
  _id: number | string;
  count: number;
  avg_salary?: number;
}

export interface DepartmentStats {
  _id: string;
  count: number;
  avg_salary: number;
  avg_age: number;
}

export interface SkillStats {
  _id: string;
  count: number;
}

export interface ApiError {
  detail: string | { loc: string[]; msg: string; type: string }[];
}

export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

// Department options based on our data
export const DEPARTMENTS = [
  'Engineering',
  'Marketing',
  'Sales',
  'HR',
  'Finance',
  'Operations',
  'Customer Support',
  'Product Management',
  'Design',
  'Quality Assurance',
  'Security'
] as const;

export type Department = typeof DEPARTMENTS[number];

// Employee status options
export const EMPLOYEE_STATUS = [
  'active',
  'on_leave',
  'inactive'
] as const;

export type EmployeeStatus = typeof EMPLOYEE_STATUS[number];

// Chart data interfaces
export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface BarChartData {
  name: string;
  count: number;
  salary?: number;
  age?: number;
}

export interface LineChartData {
  month: string;
  hires: number;
  salary: number;
}

// Employee attachment interface for file management
export interface EmployeeAttachment {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
  employeeId: string;
}
