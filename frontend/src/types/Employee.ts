export interface Employee {
  id: string;
  employee_id: string;
  name: string;
  age: number;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  employee_id: string;
  name: string;
  age: number;
  department: string;
}

export interface EmployeeUpdate {
  name?: string;
  age?: number;
  department?: string;
}

export interface DashboardStats {
  total_employees: number;
  recent_employees: number;
  department_distribution: Record<string, number>;
  monthly_additions: Array<{
    year: number;
    month: number;
    count: number;
  }>;
}
