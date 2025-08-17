import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/api';
import { Employee, EmployeeCreate, EmployeeUpdate } from '../types/Employee';

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeModal: React.FC<EmployeeModalProps> = ({ employee, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    employee_id: '',
    name: '',
    age: '',
    department: '',
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
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.employee_id.trim()) return 'Employee ID is required';
    if (!formData.name.trim()) return 'Name is required';
    if (!formData.age.trim()) return 'Age is required';
    if (!formData.department.trim()) return 'Department is required';

    const age = parseInt(formData.age);
    if (isNaN(age) || age < 18 || age > 100) {
      return 'Age must be between 18 and 100';
    }

    if (!/^EMP\d{3,}$/i.test(formData.employee_id)) {
      return 'Employee ID must start with "EMP" followed by at least 3 digits (e.g., EMP001)';
    }

    if (!/^[a-zA-Z\s\.\-']+$/.test(formData.name.trim())) {
      return 'Name can only contain letters, spaces, dots, hyphens, and apostrophes';
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
        const updateData: EmployeeUpdate = {
          name: formData.name.trim(),
          age: parseInt(formData.age),
          department: formData.department.trim(),
        };
        await employeeApi.update(employee.employee_id, updateData);
      } else {
        const createData: EmployeeCreate = {
          employee_id: formData.employee_id.toUpperCase(),
          name: formData.name.trim(),
          age: parseInt(formData.age),
          department: formData.department.trim(),
        };
        await employeeApi.create(createData);
      }
      
      onSuccess();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.response?.data?.details?.[0] || 'An error occurred';
      setError(errorMessage);
      console.error('Form submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{isEditing ? 'Edit Employee' : 'Add New Employee'}</h2>
        
        {error && <div className="error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Employee ID</label>
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
              <small style={{ color: '#6c757d', fontSize: '0.8rem' }}>
                Format: EMP followed by at least 3 digits (e.g., EMP001)
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
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

          <div className="form-group">
            <label className="form-label">Age</label>
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
            <label className="form-label">Department</label>
            <input
              type="text"
              name="department"
              value={formData.department}
              onChange={handleChange}
              className="form-control"
              placeholder="Engineering"
              required
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
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
              {loading ? 'Saving...' : (isEditing ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmployeeModal;
