import axios from 'axios';
import { Employee, EmployeeCreate, EmployeeUpdate, DashboardStats } from '../types/Employee';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const employeeApi = {
  // Get all employees
  getAll: async (skip = 0, limit = 20): Promise<Employee[]> => {
    const response = await api.get(`/employees?skip=${skip}&limit=${limit}`);
    return response.data;
  },

  // Get employee by ID
  getById: async (employeeId: string): Promise<Employee> => {
    const response = await api.get(`/employees/${employeeId}`);
    return response.data;
  },

  // Create new employee
  create: async (employee: EmployeeCreate): Promise<Employee> => {
    const response = await api.post('/employees', employee);
    return response.data;
  },

  // Update employee
  update: async (employeeId: string, employee: EmployeeUpdate): Promise<Employee> => {
    const response = await api.put(`/employees/${employeeId}`, employee);
    return response.data;
  },

  // Delete employee
  delete: async (employeeId: string): Promise<void> => {
    await api.delete(`/employees/${employeeId}`);
  },

  // Get dashboard statistics
  getDashboardStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/employees/dashboard');
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<any> => {
  const response = await axios.get(`${API_BASE_URL.replace('/api/v1', '')}/health`);
  return response.data;
};

export default api;
