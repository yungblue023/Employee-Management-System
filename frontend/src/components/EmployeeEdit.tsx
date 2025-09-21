/**
 * Employee Edit component - Dedicated page for editing employees
 * Includes attachment management functionality
 */

import React, { useState, useEffect } from 'react';
import EmployeeAPI from '../services/api';
import { Employee, EmployeeUpdate, DEPARTMENTS } from '../types/Employee';
import AttachmentManager from './AttachmentManager';

interface EmployeeEditProps {
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const EmployeeEdit: React.FC<EmployeeEditProps> = ({ employeeId, onClose, onSuccess }) => {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    department: '',
    salary: '',
    hire_date: '',
    status: 'active',
    skills: [] as string[]
  });
  const [newSkill, setNewSkill] = useState('');

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setLoading(true);
      const emp = await EmployeeAPI.getEmployeeById(employeeId);
      setEmployee(emp);
      setFormData({
        name: emp.name || '',
        age: emp.age?.toString() || '',
        department: emp.department || '',
        salary: emp.salary?.toString() || '',
        hire_date: emp.hire_date || '',
        status: emp.status || 'active',
        skills: emp.skills || []
      });
    } catch (err: any) {
      setError(`Failed to load employee: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      const updateData: EmployeeUpdate = {
        name: formData.name || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        department: formData.department || undefined,
        salary: formData.salary ? parseInt(formData.salary) : undefined,
        hire_date: formData.hire_date || undefined,
        status: formData.status as any,
        skills: formData.skills.length > 0 ? formData.skills : undefined
      };

      await EmployeeAPI.updateEmployee(employeeId, updateData);
      onSuccess();
    } catch (err: any) {
      setError(`Failed to update employee: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '40px' }}>
              Loading employee data...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-body">
            <div style={{ textAlign: 'center', padding: '40px', color: 'red' }}>
              {error || 'Employee not found'}
            </div>
            <div style={{ textAlign: 'center' }}>
              <button className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh' }}>
        <div className="modal-header">
          <h3>Edit Employee - {employee.name}</h3>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {error && (
            <div className="alert alert-danger">
              {error}
              <button className="btn-close-alert" onClick={() => setError(null)}>×</button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-group">
                <label>Employee ID</label>
                <input
                  type="text"
                  value={employee.employee_id}
                  disabled
                  className="form-control"
                  style={{ backgroundColor: '#f8f9fa' }}
                />
              </div>

              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Age *</label>
                <input
                  type="number"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  min="18"
                  max="100"
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Department *</label>
                <select
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                >
                  <option value="">Select Department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Salary</label>
                <input
                  type="number"
                  name="salary"
                  value={formData.salary}
                  onChange={handleInputChange}
                  min="0"
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Hire Date</label>
                <input
                  type="date"
                  name="hire_date"
                  value={formData.hire_date}
                  onChange={handleInputChange}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="active">Active</option>
                  <option value="on_leave">On Leave</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Skills Section */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Skills</label>
              <div className="skills-input">
                <input
                  type="text"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill"
                  className="form-control"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <button
                  type="button"
                  onClick={handleAddSkill}
                  className="btn btn-outline-primary"
                  style={{ marginLeft: '10px' }}
                >
                  Add
                </button>
              </div>
              <div className="skills-list" style={{ marginTop: '10px' }}>
                {formData.skills.map((skill, index) => (
                  <span key={index} className="skill-tag">
                    {skill}
                    <button
                      type="button"
                      onClick={() => handleRemoveSkill(skill)}
                      className="skill-remove"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
              <button
                type="submit"
                disabled={saving}
                className="btn btn-primary"
                style={{ marginRight: '10px' }}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Attachment Management Section */}
          <div className="attachment-section" style={{ marginTop: '30px', paddingTop: '20px', borderTop: '1px solid #e0e0e0' }}>
            <h4>Employee Attachments</h4>
            <p>Manage files and documents for this employee</p>
            <AttachmentManager
              employeeId={employee.employee_id}
              employeeName={employee.name}
              isInline={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeEdit;
