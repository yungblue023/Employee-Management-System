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

const EmployeeImport: React.FC = () => {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState<string>('');
  const [headers, setHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [rows, setRows] = useState<EmployeeCreate[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<{created: number; failed: number; errors: string[]; created_ids: string[]} | null>(null);

  const expectedHeaders = ['employee_id', 'name', 'age', 'department', 'salary', 'hire_date'];
  
  const headerStatus = useMemo(() => {
    if (headers.length === 0) return '';
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    const extra = headers.filter(h => !expectedHeaders.includes(h));
    
    if (missing.length === 0 && extra.length === 0) {
      return '✅ All required headers found';
    }
    
    let status = '';
    if (missing.length > 0) {
      status += `❌ Missing: ${missing.join(', ')}`;
    }
    if (extra.length > 0) {
      status += `${status ? ' | ' : ''}⚠️ Extra: ${extra.join(', ')}`;
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
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        
        if (parsed.length < 2) {
          setErrors(['File must contain at least a header row and one data row']);
          return;
        }

        const [headerRow, ...dataRows] = parsed;
        setHeaders(headerRow.map(h => h.toLowerCase().trim()));
        setRawRows(dataRows);

        // Convert to EmployeeCreate objects
        const employees: EmployeeCreate[] = [];
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

            // Validate required fields
            if (!employee.employee_id || !employee.name || !employee.department) {
              parseErrors.push(`Row ${index + 2}: Missing required fields (employee_id, name, department)`);
              return;
            }

            employees.push(employee as EmployeeCreate);
          } catch (err) {
            parseErrors.push(`Row ${index + 2}: ${err}`);
          }
        });

        setRows(employees);
        setErrors(parseErrors);
      } catch (err) {
        setErrors([`Failed to parse CSV: ${err}`]);
      }
    };

    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (rows.length === 0) return;

    setLoading(true);
    try {
      const results = {
        created: 0,
        failed: 0,
        errors: [] as string[],
        created_ids: [] as string[]
      };

      for (const employee of rows) {
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
    } catch (err: any) {
      setErrors([`Import failed: ${err.message}`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="import-container">
      {/* Header Section */}
      <div className="import-header">
        <div className="import-header-content">
          <div className="import-icon">
            📊
          </div>
          <div className="import-title-section">
            <h1 className="import-title">Batch Import Employees</h1>
            <p className="import-subtitle">
              Upload employee data in bulk using CSV files
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="import-content">
        {/* Upload Section */}
        <div className="upload-section">
          <div className="upload-card">
            <div className="upload-icon">
              📁
            </div>
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
                <span className="file-input-icon">📎</span>
                Choose File
              </label>
            </div>

            {fileName && (
              <div className="selected-file">
                <span className="file-icon">📄</span>
                <span className="file-name">{fileName}</span>
                <span className="file-status">✓</span>
              </div>
            )}
          </div>
        </div>

        {/* Header Status */}
        {headers.length > 0 && (
          <div className={`status-card ${headerStatus.includes('✓') ? 'status-success' : 'status-warning'}`}>
            <div className="status-icon">
              {headerStatus.includes('✓') ? '✅' : '⚠️'}
            </div>
            <div className="status-content">
              <h4 className="status-title">Header Validation</h4>
              <p className="status-message">{headerStatus}</p>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="error-card">
            <div className="error-icon">❌</div>
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

        {/* Data Preview Section */}
        {rows.length > 0 && (
          <div className="preview-section">
            <div className="preview-header">
              <div className="preview-info">
                <h3 className="preview-title">Data Preview</h3>
                <div className="preview-stats">
                  <span className="stat-badge">
                    <span className="stat-icon">📋</span>
                    {rows.length} Records Found
                  </span>
                  <span className="stat-badge">
                    <span className="stat-icon">✅</span>
                    Ready to Import
                  </span>
                </div>
              </div>
            </div>

            <div className="preview-table-container">
              <div className="table-wrapper">
                <table className="preview-table">
                  <thead>
                    <tr>
                      {headers.map(h => (
                        <th key={h} className="preview-th">
                          {h.replace('_', ' ').toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 10).map((row, i) => (
                      <tr key={i} className="preview-tr">
                        {row.map((cell, j) => (
                          <td key={j} className="preview-td">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rawRows.length > 10 && (
                <div className="preview-footer">
                  <span className="preview-more">
                    ... and {rawRows.length - 10} more rows
                  </span>
                </div>
              )}
            </div>

            {/* Import Action */}
            <div className="import-action">
              <button
                onClick={handleImport}
                disabled={loading || errors.length > 0}
                className={`import-btn ${loading ? 'import-btn-loading' : 'import-btn-ready'}`}
              >
                <span className="import-btn-icon">
                  {loading ? '⏳' : '🚀'}
                </span>
                {loading ? 'Importing...' : `Import ${rows.length} Employees`}
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="results-section">
            <div className="results-header">
              <h3 className="results-title">Import Complete!</h3>
              <div className="results-summary">
                <div className="result-stat success">
                  <div className="result-icon">✅</div>
                  <div className="result-content">
                    <span className="result-number">{result.created}</span>
                    <span className="result-label">Created</span>
                  </div>
                </div>
                <div className="result-stat error">
                  <div className="result-icon">❌</div>
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
                    <span className="error-summary-icon">⚠️</span>
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
                onClick={() => navigate('/employees')}
                className="view-employees-btn"
              >
                <span className="btn-icon">👥</span>
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
