/**
 * Employee Modal component for creating and editing employees
 * Features: Department dropdown, skills management, validation
 */

import React, { useState, useEffect } from 'react';
import EmployeeAPI from '../services/api';
import { Employee, EmployeeCreate, EmployeeUpdate, DEPARTMENTS } from '../types/Employee';

interface EmployeeModalProps {
  employee?: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    age: '',
    department: '',
    salary: '',
    hire_date: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!employee;

  useEffect(() => {
    if (employee) {
      setFormData({
        employee_id: employee.employee_id,
        name: employee.name,
        age: employee.age.toString(),
        department: employee.department,
        salary: employee.salary?.toString() || '',
        hire_date: employee.hire_date || ''
      });
    } else {
      // Generate next employee ID for new employees
      setFormData({
        employee_id: '',
        name: '',
        age: '',
        department: '',
        salary: '',
        hire_date: new Date().toISOString().split('T')[0] // Today's date
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



  const validateForm = (): string | null => {
    if (!formData.employee_id.trim()) {
      return 'Employee ID is required';
    }
    if (!formData.name.trim()) {
      return 'Name is required';
    }
    if (!formData.age || parseInt(formData.age) < 18 || parseInt(formData.age) > 100) {
      return 'Age must be between 18 and 100';
    }
    if (!formData.department) {
      return 'Department is required';
    }
    if (formData.salary && (parseInt(formData.salary) < 0 || parseInt(formData.salary) > 1000000)) {
      return 'Salary must be between 0 and 1,000,000';
    }
    
    // Validate employee ID format for new employees
    if (!isEditing && !/^EMP\d{3,}$/.test(formData.employee_id.toUpperCase())) {
      return 'Employee ID must follow format EMP### (e.g., EMP001)';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        // Update existing employee
        const updateData: EmployeeUpdate = {
          name: formData.name.trim(),
          age: parseInt(formData.age),
          department: formData.department,
          salary: formData.salary ? parseInt(formData.salary) : undefined,
          hire_date: formData.hire_date || undefined
        };
        await EmployeeAPI.updateEmployee(employee!.employee_id, updateData);
      } else {
        // Create new employee
        const createData: EmployeeCreate = {
          employee_id: formData.employee_id.toUpperCase(),
          name: formData.name.trim(),
          age: parseInt(formData.age),
          department: formData.department,
          salary: formData.salary ? parseInt(formData.salary) : undefined,
          hire_date: formData.hire_date || undefined
        };
        await EmployeeAPI.createEmployee(createData);
      }
      
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Employee ID *</label>
              <input
                type="text"
                name="employee_id"
                value={formData.employee_id}
                onChange={handleChange}
                className="form-control"
                placeholder="EMP001"
                disabled={isEditing}
                required
              />
              {!isEditing && (
                <small className="form-help">Format: EMP followed by numbers (e.g., EMP001)</small>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Age *</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                className="form-control"
                placeholder="30"
                min="18"
                max="100"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Department *</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="form-control"
                required
              >
                <option value="">Select Department</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Salary</label>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="form-control"
                placeholder="75000"
                min="0"
                max="1000000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hire Date</label>
              <input
                type="date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleChange}
                className="form-control"
              />
            </div>
          </div>





          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (isEditing ? 'Update Employee' : 'Add Employee')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
