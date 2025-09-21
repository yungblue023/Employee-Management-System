/**
 * Employee List component with filtering and CRUD operations
 * Features: Department dropdown, search, add/edit/delete employees
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeAPI from '../services/api';
import { Employee, DEPARTMENTS } from '../types/Employee';
import EmployeeModal from './EmployeeModal';

interface EmployeeListProps {
  onEmployeeChange: () => void;
  onEditEmployee?: (employeeId: string) => void;
}

const EmployeeList: React.FC<EmployeeListProps> = ({ onEmployeeChange, onEditEmployee }) => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [salaryRange, setSalaryRange] = useState({ min: '', max: '' });
  const [ageRange, setAgeRange] = useState({ min: '', max: '' });
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'age' | 'salary' | 'hire_date'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    filterAndSortEmployees();
  }, [employees, searchTerm, selectedDepartment, salaryRange, ageRange, sortBy, sortOrder]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await EmployeeAPI.getAllEmployees(0, 100);
      setEmployees(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load employees');
      console.error('Fetch employees error:', err);
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortEmployees = () => {
    let filtered = employees.filter(employee => {
      const matchesSearch =
        employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.department.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesDepartment = !selectedDepartment || employee.department === selectedDepartment;

      const matchesSalaryRange = (!salaryRange.min || (employee.salary && employee.salary >= parseInt(salaryRange.min))) &&
                                (!salaryRange.max || (employee.salary && employee.salary <= parseInt(salaryRange.max)));

      const matchesAgeRange = (!ageRange.min || employee.age >= parseInt(ageRange.min)) &&
                             (!ageRange.max || employee.age <= parseInt(ageRange.max));

      return matchesSearch && matchesDepartment && matchesSalaryRange && matchesAgeRange;
    });

    // Sort employees
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'age':
          aValue = a.age;
          bValue = b.age;
          break;
        case 'salary':
          aValue = a.salary || 0;
          bValue = b.salary || 0;
          break;
        case 'hire_date':
          aValue = new Date(a.hire_date || '1900-01-01');
          bValue = new Date(b.hire_date || '1900-01-01');
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredEmployees(filtered);
  };

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowModal(true);
  };

  const handleEdit = (employee: Employee) => {
    if (onEditEmployee) {
      // Use external edit handler (for dedicated edit page)
      onEditEmployee(employee.employee_id);
    } else {
      // Use modal edit (fallback)
      setEditingEmployee(employee);
      setShowModal(true);
    }
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.name}?`)) {
      try {
        await EmployeeAPI.deleteEmployee(employee.employee_id);
        await fetchEmployees();
        onEmployeeChange();
      } catch (err: any) {
        alert(`Failed to delete employee: ${err.message}`);
      }
    }
  };

  const handleModalSuccess = async () => {
    setShowModal(false);
    setEditingEmployee(null);
    await fetchEmployees();
    onEmployeeChange();
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingEmployee(null);
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const filters: any = {};

      // Add current filters to export
      if (selectedDepartment) filters.department = selectedDepartment;
      if (searchTerm) filters.search = searchTerm;
      if (salaryRange.min) filters.min_salary = parseInt(salaryRange.min);
      if (salaryRange.max) filters.max_salary = parseInt(salaryRange.max);
      if (ageRange.min) filters.min_age = parseInt(ageRange.min);
      if (ageRange.max) filters.max_age = parseInt(ageRange.max);

      await EmployeeAPI.exportEmployeesCSV(filters);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  const handleImportEmployees = () => {
    navigate('/employees/import');
  };

  const handleSort = (field: 'name' | 'age' | 'salary' | 'hire_date') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortBy !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  // Get unique departments from current employees
  const availableDepartments = Array.from(new Set(employees.map(emp => emp.department))).sort();

  if (loading) {
    return (
      <div className="employee-list">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="employee-list">
        <div className="error">
          <h3>Error Loading Employees</h3>
          <p>{error}</p>
          <button onClick={fetchEmployees} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="employee-list">
      <div className="employee-list-header">
        <h2>Employee Management</h2>
        <p>Manage employee information and records</p>
      </div>

      {/* Filters and Controls */}
      <div className="controls-section">
        <div className="filters">
          <div className="filter-row">
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control search-box"
            />

            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="form-control department-filter"
            >
              <option value="">All Departments</option>
              {availableDepartments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>


          </div>

          <div className="filter-row">
            <div className="range-filter">
              <label>Salary Range:</label>
              <input
                type="number"
                placeholder="Min"
                value={salaryRange.min}
                onChange={(e) => setSalaryRange(prev => ({ ...prev, min: e.target.value }))}
                className="form-control range-input"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={salaryRange.max}
                onChange={(e) => setSalaryRange(prev => ({ ...prev, max: e.target.value }))}
                className="form-control range-input"
              />
            </div>

            <div className="range-filter">
              <label>Age Range:</label>
              <input
                type="number"
                placeholder="Min"
                value={ageRange.min}
                onChange={(e) => setAgeRange(prev => ({ ...prev, min: e.target.value }))}
                className="form-control range-input"
                min="18"
                max="100"
              />
              <span>to</span>
              <input
                type="number"
                placeholder="Max"
                value={ageRange.max}
                onChange={(e) => setAgeRange(prev => ({ ...prev, max: e.target.value }))}
                className="form-control range-input"
                min="18"
                max="100"
              />
            </div>

            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDepartment('');

                setSalaryRange({ min: '', max: '' });
                setAgeRange({ min: '', max: '' });
              }}
              className="btn btn-secondary clear-filters"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="actions">
          <button className="btn btn-primary" onClick={handleAdd}>
            Add Employee
          </button>
          <button
            className="btn btn-success"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export CSV'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleImportEmployees}
          >
            Import CSV
          </button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <p>
          Showing {filteredEmployees.length} of {employees.length} employees
          {selectedDepartment && ` in ${selectedDepartment}`}

        </p>
      </div>

      {/* Employee Table */}
      {filteredEmployees.length === 0 ? (
        <div className="no-employees">
          <h3>No Employees Found</h3>
          <p>
            {employees.length === 0 
              ? "No employees have been added yet." 
              : "No employees match your search criteria."
            }
          </p>
          {employees.length === 0 && (
            <button className="btn btn-primary" onClick={handleAdd}>
              Add First Employee
            </button>
          )}
        </div>
      ) : (
        <div className="employee-table-container">
          <table className="employee-table">
            <thead>
              <tr>
                <th onClick={() => handleSort('name')} className="sortable">
                  Name {getSortIcon('name')}
                </th>
                <th>ID</th>
                <th onClick={() => handleSort('age')} className="sortable">
                  Age {getSortIcon('age')}
                </th>
                <th>Department</th>
                <th onClick={() => handleSort('salary')} className="sortable">
                  Salary {getSortIcon('salary')}
                </th>
                <th onClick={() => handleSort('hire_date')} className="sortable">
                  Hire Date {getSortIcon('hire_date')}
                </th>
                <th>Files</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td className="employee-name">{employee.name}</td>
                  <td className="employee-id">{employee.employee_id}</td>
                  <td>{employee.age}</td>
                  <td>
                    <span className="department-badge">{employee.department}</span>
                  </td>
                  <td className="salary">
                    {employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A'}
                  </td>
                  <td>
                    {employee.hire_date
                      ? new Date(employee.hire_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </td>
                  <td className="files">
                    {employee.files && employee.files.length > 0 ? (
                      <div className="file-count">
                        <span className="file-badge">
                          {employee.files.length} file{employee.files.length !== 1 ? 's' : ''}
                        </span>
                        <div className="file-list">
                          {employee.files.map((file, index) => (
                            <div key={index} className="file-item" title={file.originalName}>
                              {file.originalName}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="no-files">No files</span>
                    )}
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEdit(employee)}
                      title="Edit Employee"
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(employee)}
                      title="Delete Employee"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
