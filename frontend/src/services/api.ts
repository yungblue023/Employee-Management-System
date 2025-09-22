/**
 * API service for Employee Management System
 * Connects to FastAPI backend and MongoDB data
 */

import axios, { AxiosResponse } from 'axios';
import { 
  Employee, 
  EmployeeCreate, 
  EmployeeUpdate, 
  DashboardStats,
  DepartmentStats,
  SkillStats,
  AgeDemographic
} from '../types/Employee';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and authentication
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    console.log('Full config:', config);

    // Add authentication token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });

    // Handle 401 Unauthorized - redirect to login
    if (error.response?.status === 401) {
      console.log('401 Unauthorized - redirecting to login');
      localStorage.removeItem('access_token');
      localStorage.removeItem('current_user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export class EmployeeAPI {
  /**
   * Create a new employee
   */
  static async createEmployee(employee: EmployeeCreate): Promise<Employee> {
    try {
      const response: AxiosResponse<Employee> = await api.post('/employees/', employee);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all employees with pagination
   */
  static async getAllEmployees(skip: number = 0, limit: number = 100): Promise<Employee[]> {
    try {
      const response: AxiosResponse<Employee[]> = await api.get('/employees/', {
        params: { skip, limit }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(employeeId: string): Promise<Employee> {
    try {
      const response: AxiosResponse<Employee> = await api.get(`/employees/${employeeId}`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an employee
   */
  static async updateEmployee(employeeId: string, updates: EmployeeUpdate): Promise<Employee> {
    try {
      const response: AxiosResponse<Employee> = await api.put(`/employees/${employeeId}`, updates);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete an employee
   */
  static async deleteEmployee(employeeId: string): Promise<void> {
    try {
      await api.delete(`/employees/${employeeId}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get dashboard statistics
   */
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      const response: AxiosResponse<DashboardStats> = await api.get('/employees/dashboard/stats');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get department statistics
   */
  static async getDepartmentStats(): Promise<DepartmentStats[]> {
    try {
      const response: AxiosResponse<DepartmentStats[]> = await api.get('/employees/departments');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get skill statistics
   */
  static async getSkillStats(): Promise<SkillStats[]> {
    try {
      const response: AxiosResponse<SkillStats[]> = await api.get('/employees/skills');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get age demographics
   */
  static async getAgeDemographics(): Promise<AgeDemographic[]> {
    try {
      const response: AxiosResponse<AgeDemographic[]> = await api.get('/employees/age-demographics');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Filter employees by department
   */
  static async getEmployeesByDepartment(department: string): Promise<Employee[]> {
    try {
      const response: AxiosResponse<Employee[]> = await api.get('/employees/', {
        params: { department }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Search employees
   */
  static async searchEmployees(query: string): Promise<Employee[]> {
    try {
      const response: AxiosResponse<Employee[]> = await api.get('/employees/search', {
        params: { q: query }
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Export employees as CSV
   */
  static async exportEmployeesCSV(filters: {
    department?: string;
    status?: string;
    min_salary?: number;
    max_salary?: number;
    min_age?: number;
    max_age?: number;
    search?: string;
  } = {}): Promise<void> {
    try {
      const params = new URLSearchParams();

      // Add filters to params
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, value.toString());
        }
      });

      const response = await api.get('/employees/export/csv', {
        params,
        responseType: 'blob'
      });

      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `employees_export_${timestamp}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Check API health
   */
  static async healthCheck(): Promise<any> {
    try {
      const response = await axios.get('http://localhost:8000/health');
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload file for employee
   */
  static async uploadFile(employeeId: string, file: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post(`/employees/${employeeId}/files/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get files for employee
   */
  static async getEmployeeFiles(employeeId: string): Promise<any[]> {
    try {
      const response = await api.get(`/employees/${employeeId}/files`);
      return response.data;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Download file
   */
  static async downloadFile(fileId: string): Promise<void> {
    try {
      const response = await api.get(`/files/${fileId}/download`, {
        responseType: 'blob',
      });

      // Get content type and filename from response headers
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'download';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create download link with proper MIME type
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Get file preview data with authentication
   */
  static async getFilePreview(fileId: string): Promise<{ blob: Blob; mimeType: string }> {
    try {
      const response = await api.get(`/files/${fileId}/preview`, {
        responseType: 'blob',
      });

      const contentType = response.headers['content-type'] || 'application/octet-stream';
      return {
        blob: response.data,
        mimeType: contentType
      };
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete file
   */
  static async deleteFile(fileId: string): Promise<void> {
    try {
      await api.delete(`/files/${fileId}`);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private static handleError(error: any): Error {
    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.detail || 'An error occurred';
      return new Error(Array.isArray(message) ? message[0]?.msg || 'Validation error' : message);
    } else if (error.request) {
      // Request was made but no response received
      return new Error('Unable to connect to the server. Please check if the backend is running.');
    } else {
      // Something else happened
      return new Error(error.message || 'An unexpected error occurred');
    }
  }
}

export default EmployeeAPI;

