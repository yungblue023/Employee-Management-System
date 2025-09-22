import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EmployeeAPI from '../services/api';
import { EmployeeCreate } from '../types/Employee';

// CSV parsing utility
const parseCSV = (text: string): string[][] => {
  const lines = text.split('\n').filter(line => line.trim());
  const result: string[][] = [];
  
  for (const line of lines) {
    const row: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    row.push(current.trim());
    result.push(row);
  }
  
  return result;
};

interface EditableEmployee extends EmployeeCreate {
  id: string;
  isValid: boolean;
  validationErrors: { [key: string]: string };
  isExcluded: boolean;
}

const EmployeeImport: React.FC = () => {
  const navigate = useNavigate();

  // Fetch existing employee IDs from database
  const fetchExistingEmployees = async (): Promise<string[]> => {
    try {
      const employees = await EmployeeAPI.getAllEmployees();
      return employees.map((emp: any) => emp.employee_id);
    } catch (error) {
      console.error('Error fetching existing employees:', error);
      return [];
    }
  };
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [editableEmployees, setEditableEmployees] = useState<EditableEmployee[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{created: number; failed: number; errors: string[]; created_ids: string[]} | null>(null);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'import' | 'complete'>('upload');
  const [existingEmployees, setExistingEmployees] = useState<string[]>([]);

  const expectedHeaders = ['employee_id', 'name', 'age', 'department', 'salary', 'hire_date'];

  // Validation functions
  const validateEmployee = (employee: EditableEmployee, allEmployees: EditableEmployee[]): { isValid: boolean; errors: { [key: string]: string } } => {
    const errors: { [key: string]: string } = {};

    // Employee ID validation
    if (!employee.employee_id || employee.employee_id.trim() === '') {
      errors.employee_id = 'Employee ID is required';
    } else {
      const currentEmployeeId = employee.employee_id.trim();

      // Check for duplicates within CSV
      const csvDuplicates = allEmployees.filter(emp =>
        emp.employee_id && emp.employee_id.trim() === currentEmployeeId && emp.id !== employee.id
      );
      if (csvDuplicates.length > 0) {
        errors.employee_id = 'Duplicate Employee ID found in CSV';
      }

      // Check for duplicates against existing database employees
      if (existingEmployees.includes(currentEmployeeId)) {
        errors.employee_id = 'Employee ID already exists in database';
      }
    }

    // Name validation
    if (!employee.name || employee.name.trim() === '') {
      errors.name = 'Name is required';
    } else if (employee.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Age validation
    if (!employee.age) {
      errors.age = 'Age is required';
    } else {
      const ageNum = Number(employee.age);
      if (isNaN(ageNum) || ageNum < 16 || ageNum > 100) {
        errors.age = 'Age must be a number between 16 and 100';
      }
    }

    // Department validation
    if (!employee.department || employee.department.trim() === '') {
      errors.department = 'Department is required';
    }

    // Salary validation
    if (!employee.salary) {
      errors.salary = 'Salary is required';
    } else {
      const salaryNum = Number(employee.salary);
      if (isNaN(salaryNum) || salaryNum < 0) {
        errors.salary = 'Salary must be a valid positive number';
      }
    }

    // Hire date validation
    if (!employee.hire_date || employee.hire_date.trim() === '') {
      errors.hire_date = 'Hire date is required';
    } else {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(employee.hire_date)) {
        errors.hire_date = 'Hire date must be in YYYY-MM-DD format';
      } else {
        const date = new Date(employee.hire_date);
        if (isNaN(date.getTime())) {
          errors.hire_date = 'Invalid date';
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Validate all employees and update their status
  const validateAllEmployees = (employees: EditableEmployee[]): EditableEmployee[] => {
    return employees.map(emp => {
      const validation = validateEmployee(emp, employees);
      return {
        ...emp,
        isValid: validation.isValid,
        validationErrors: validation.errors
      };
    });
  };
  
  const headerStatus = useMemo(() => {
    if (headers.length === 0) return '';
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    const extra = headers.filter(h => !expectedHeaders.includes(h));

    if (missing.length === 0 && extra.length === 0) {
      return 'SUCCESS: All required headers found';
    }

    let status = '';
    if (missing.length > 0) {
      status += `ERROR: Missing headers: ${missing.join(', ')}`;
    }
    if (extra.length > 0) {
      status += `${status ? ' | ' : ''}WARNING: Extra headers: ${extra.join(', ')}`;
    }
    return status;
  }, [headers]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setErrors([]);
    setResult(null);

    if (!file.name.endsWith('.csv')) {
      setErrors(['Only CSV files are supported']);
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        
        if (parsed.length < 2) {
          setErrors(['File must contain at least a header row and one data row']);
          return;
        }

        const [headerRow, ...dataRows] = parsed;
        setHeaders(headerRow.map(h => h.toLowerCase().trim()));

        // Fetch existing employees from database
        const existingEmployeeIds = await fetchExistingEmployees();
        setExistingEmployees(existingEmployeeIds);

        // Convert to EmployeeCreate objects
        const editableEmps: EditableEmployee[] = [];
        const parseErrors: string[] = [];

        dataRows.forEach((row, index) => {
          try {
            const employee: any = {};
            headerRow.forEach((header, colIndex) => {
              const key = header.toLowerCase().trim();
              const value = row[colIndex]?.trim() || '';

              if (key === 'age' || key === 'salary') {
                employee[key] = value ? parseInt(value) : undefined;
              } else if (key === 'skills') {
                employee[key] = value ? value.split(',').map(s => s.trim()) : [];
              } else {
                employee[key] = value || undefined;
              }
            });

            const empCreate = employee as EmployeeCreate;

            editableEmps.push({
              ...empCreate,
              id: `emp_${index}`,
              isValid: false, // Will be validated after all employees are loaded
              validationErrors: {},
              isExcluded: false
            });
          } catch (err) {
            parseErrors.push(`Row ${index + 2}: ${err}`);
          }
        });

        // Validate all employees for duplicates and other issues
        const validatedEmployees = validateAllEmployees(editableEmps);

        setEditableEmployees(validatedEmployees);
        setErrors(parseErrors);

        if (validatedEmployees.length > 0) {
          setCurrentStep('preview');
        }
      } catch (err) {
        setErrors([`Failed to parse CSV: ${err}`]);
      }
    };

    reader.readAsText(file);
  };

  // Handle editing employee data
  const updateEmployee = (id: string, field: keyof EmployeeCreate, value: any) => {
    setEditableEmployees(prev => {
      const updated = prev.map(emp => {
        if (emp.id === id) {
          return { ...emp, [field]: value };
        }
        return emp;
      });

      // Re-validate all employees to check for duplicates
      return validateAllEmployees(updated);
    });
  };

  // Get valid employees for import
  const getValidEmployeesForImport = (): EmployeeCreate[] => {
    return editableEmployees
      .filter(emp => emp.isValid)
      .map(emp => ({
        employee_id: emp.employee_id,
        name: emp.name,
        age: emp.age,
        department: emp.department,
        salary: emp.salary,
        hire_date: emp.hire_date
      }));
  };

  const handleImport = async () => {
    const validEmployees = getValidEmployeesForImport();
    if (validEmployees.length === 0) return;

    setLoading(true);
    setCurrentStep('import');

    try {
      const results = {
        created: 0,
        failed: 0,
        errors: [] as string[],
        created_ids: [] as string[]
      };

      for (const employee of validEmployees) {
        try {
          const created = await EmployeeAPI.createEmployee(employee);
          results.created++;
          results.created_ids.push(created.employee_id);
        } catch (err: any) {
          results.failed++;
          results.errors.push(`${employee.employee_id}: ${err.message}`);
        }
      }

      setResult(results);
      setCurrentStep('complete');
    } catch (err: any) {
      setErrors([`Import failed: ${err.message}`]);
      setCurrentStep('preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-container">
      {/* Header Section */}
      <div className="import-header">
        <div className="import-header-content">
          <div className="import-title-section">
            <h1 className="import-title">Employee Import</h1>
            <p className="import-subtitle">
              Upload and review employee data before importing to the system
            </p>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="import-steps">
        <div className={`step ${currentStep === 'upload' ? 'active' : (currentStep === 'preview' || currentStep === 'import' || currentStep === 'complete') ? 'completed' : ''}`}>
          <span className="step-number">1</span>
          <span className="step-label">Upload CSV</span>
        </div>
        <div className={`step ${currentStep === 'preview' ? 'active' : (currentStep === 'import' || currentStep === 'complete') ? 'completed' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Review Data</span>
        </div>
        <div className={`step ${currentStep === 'import' ? 'active' : currentStep === 'complete' ? 'completed' : ''}`}>
          <span className="step-number">3</span>
          <span className="step-label">Import</span>
        </div>
        <div className={`step ${currentStep === 'complete' ? 'active' : ''}`}>
          <span className="step-number">4</span>
          <span className="step-label">Complete</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="import-content">
        {currentStep === 'upload' && (
          <div className="upload-section">
            <div className="upload-card">
              <h3 className="upload-title">Select CSV File</h3>
              <p className="upload-description">
                Choose a CSV file with the following columns:<br/>
                <code>employee_id, name, age, department, salary, hire_date</code>
              </p>

              <div className="file-input-wrapper">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFile}
                  className="file-input"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="file-input-label">
                  Choose File
                </label>
              </div>

              {fileName && (
                <div className="selected-file">
                  <span className="file-name">{fileName}</span>
                  <span className="file-status">Ready</span>
                </div>
              )}

              {/* Header Status */}
              {headers.length > 0 && (
                <div className={`status-card ${headerStatus.includes('SUCCESS') ? 'status-success' : 'status-warning'}`}>
                  <div className="status-content">
                    <h4 className="status-title">Header Validation</h4>
                    <p className="status-message">{headerStatus}</p>
                  </div>
                </div>
              )}

              {/* Error Messages */}
              {errors.length > 0 && (
                <div className="error-card">
                  <div className="error-content">
                    <h4 className="error-title">Import Errors</h4>
                    <div className="error-list">
                      {errors.map((e, i) => (
                        <div key={i} className="error-item">{e}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Section */}
        {currentStep === 'preview' && editableEmployees.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <h3 className="preview-title">Review Employee Data</h3>
              <p className="preview-subtitle">
                Review and edit employee information before importing. Invalid entries are highlighted in red.
              </p>
              <div className="preview-stats">
                <span className="stat">
                  Total: {editableEmployees.length}
                </span>
                <span className="stat">
                  Valid: {editableEmployees.filter(emp => emp.isValid).length}
                </span>
                <span className="stat">
                  Invalid: {editableEmployees.filter(emp => !emp.isValid).length}
                </span>
              </div>
            </div>

            <div className="preview-table-container">
              <table className="preview-table">
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th>Age</th>
                    <th>Department</th>
                    <th>Salary</th>
                    <th>Hire Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {editableEmployees.map((employee) => (
                    <tr key={employee.id} className={`preview-row ${!employee.isValid ? 'invalid' : ''}`}>
                      <td>
                        <input
                          type="text"
                          value={employee.employee_id || ''}
                          onChange={(e) => updateEmployee(employee.id, 'employee_id', e.target.value)}
                          className={`edit-input ${employee.validationErrors.employee_id ? 'error' : ''}`}
                          title={employee.validationErrors.employee_id || ''}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={employee.name || ''}
                          onChange={(e) => updateEmployee(employee.id, 'name', e.target.value)}
                          className={`edit-input ${employee.validationErrors.name ? 'error' : ''}`}
                          title={employee.validationErrors.name || ''}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={employee.age || ''}
                          onChange={(e) => updateEmployee(employee.id, 'age', parseInt(e.target.value) || undefined)}
                          className={`edit-input ${employee.validationErrors.age ? 'error' : ''}`}
                          title={employee.validationErrors.age || ''}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={employee.department || ''}
                          onChange={(e) => updateEmployee(employee.id, 'department', e.target.value)}
                          className={`edit-input ${employee.validationErrors.department ? 'error' : ''}`}
                          title={employee.validationErrors.department || ''}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          value={employee.salary || ''}
                          onChange={(e) => updateEmployee(employee.id, 'salary', parseInt(e.target.value) || undefined)}
                          className={`edit-input ${employee.validationErrors.salary ? 'error' : ''}`}
                          title={employee.validationErrors.salary || ''}
                        />
                      </td>
                      <td>
                        <input
                          type="date"
                          value={employee.hire_date || ''}
                          onChange={(e) => updateEmployee(employee.id, 'hire_date', e.target.value)}
                          className={`edit-input ${employee.validationErrors.hire_date ? 'error' : ''}`}
                          title={employee.validationErrors.hire_date || ''}
                        />
                      </td>
                      <td>
                        <span className={`status-badge ${employee.isValid ? 'valid' : 'invalid'}`}>
                          {employee.isValid ? 'VALID' : 'INVALID'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="preview-actions">
              <button
                onClick={() => setCurrentStep('upload')}
                className="btn btn-secondary"
              >
                Back to Upload
              </button>
              <button
                onClick={handleImport}
                disabled={getValidEmployeesForImport().length === 0}
                className="btn btn-primary"
              >
                Import {getValidEmployeesForImport().length} Valid Employees
              </button>
            </div>
          </div>
        )}

        {/* Import Progress Section */}
        {currentStep === 'import' && (
          <div className="import-progress-section">
            <div className="progress-card">
              <h3 className="progress-title">Importing Employees</h3>
              <p className="progress-subtitle">Please wait while we process your data...</p>
              <div className="progress-indicator">
                <div className="spinner"></div>
                <span className="progress-text">Processing {getValidEmployeesForImport().length} employees</span>
              </div>
            </div>
          </div>
        )}

        {/* Results Section */}
        {currentStep === 'complete' && result && (
          <div className="results-section">
            <div className="results-header">
              <h3 className="results-title">Import Complete</h3>
              <div className="results-summary">
                <div className="result-stat success">
                  <div className="result-content">
                    <span className="result-number">{result.created}</span>
                    <span className="result-label">Created</span>
                  </div>
                </div>
                <div className="result-stat error">
                  <div className="result-content">
                    <span className="result-number">{result.failed}</span>
                    <span className="result-label">Failed</span>
                  </div>
                </div>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="results-errors">
                <details className="error-details">
                  <summary className="error-summary">
                    View Error Details ({result.errors.length})
                  </summary>
                  <div className="error-details-content">
                    {result.errors.map((e, i) => (
                      <div key={i} className="error-detail-item">{e}</div>
                    ))}
                  </div>
                </details>
              </div>
            )}

            <div className="results-actions">
              <button
                onClick={() => {
                  setCurrentStep('upload');
                  setFileName('');
                  setHeaders([]);
                  setEditableEmployees([]);
                  setErrors([]);
                  setResult(null);
                  setExistingEmployees([]);
                }}
                className="btn btn-secondary"
              >
                Import More Employees
              </button>
              <button
                onClick={() => navigate('/employees')}
                className="btn btn-primary"
                style={{ marginLeft: '1rem' }}
              >
                View All Employees
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeImport;
