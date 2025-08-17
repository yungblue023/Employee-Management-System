import React, { useState, useEffect } from 'react';
import { employeeApi } from '../services/api';
import { Employee } from '../types/Employee';
import EmployeeModal from './EmployeeModal';

interface EmployeeListProps {
  onEmployeeChange: () => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ onEmployeeChange }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await employeeApi.getAll();
      setEmployees(data);
    } catch (err) {
      setError('Failed to load employees');
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) {
      return;
    }

    try {
      await employeeApi.delete(employeeId);
      await fetchEmployees();
      onEmployeeChange();
    } catch (err) {
      alert('Failed to delete employee');
      console.error('Delete error:', err);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    setEditingEmployee(null);
    fetchEmployees();
    onEmployeeChange();
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        {error}
        <button className="btn btn-primary" onClick={fetchEmployees} style={{ marginLeft: '12px' }}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="page-title">Employee Management</h1>
      
      <div className="actions">
        <input
          type="text"
          placeholder="Search employees..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-control search-box"
        />
        <button className="btn btn-primary" onClick={handleAdd}>
          Add Employee
        </button>
      </div>

      {filteredEmployees.length === 0 ? (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#6c757d', margin: 0 }}>
            {searchTerm ? 'No employees found matching your search.' : 'No employees found.'}
          </p>
        </div>
      ) : (
        <div className="employee-grid">
          {filteredEmployees.map((employee) => (
            <div key={employee.id} className="employee-card">
              <div className="employee-header">
                <span className="employee-id">{employee.employee_id}</span>
              </div>
              
              <div className="employee-name">{employee.name}</div>
              
              <div className="employee-details">
                <div className="employee-detail">
                  <strong>Age:</strong> {employee.age}
                </div>
                <div className="employee-detail">
                  <strong>Department:</strong> {employee.department}
                </div>
                <div className="employee-detail">
                  <strong>Joined:</strong> {new Date(employee.created_at).toLocaleDateString()}
                </div>
              </div>
              
              <div className="employee-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={() => handleEdit(employee)}
                >
                  Edit
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(employee.employee_id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={handleModalClose}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
};

export default EmployeeList;
