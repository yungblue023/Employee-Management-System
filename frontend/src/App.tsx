/**
 * Main App component for Employee Management System
 * Features: Dashboard with charts, Employee list, Department filtering
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import './App.css';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import EmployeeImport from './components/EmployeeImport';
import EmployeeEdit from './components/EmployeeEdit';
import Header from './components/Header';

// Wrapper components for routes that need props
const EmployeeListWrapper: React.FC = () => {
  const navigate = useNavigate();

  const handleEditEmployee = (employeeId: string) => {
    navigate(`/employees/edit/${employeeId}`);
  };

  return (
    <EmployeeList
      onEmployeeChange={() => {}} // No longer needed with router
      onEditEmployee={handleEditEmployee}
    />
  );
};

const EmployeeEditWrapper: React.FC = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/employees');
  };

  const handleSuccess = () => {
    navigate('/employees');
  };

  if (!employeeId) {
    return <Navigate to="/employees" replace />;
  }

  return (
    <EmployeeEdit
      employeeId={employeeId}
      onClose={handleClose}
      onSuccess={handleSuccess}
    />
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="App">
        <Header />

        <main className="main-content">
          <Routes>
            {/* Dashboard - Home page */}
            <Route path="/" element={<Dashboard />} />

            {/* Employees List */}
            <Route path="/employees" element={<EmployeeListWrapper />} />

            {/* Import Employees */}
            <Route path="/employees/import" element={<EmployeeImport />} />

            {/* Edit Employee */}
            <Route path="/employees/edit/:employeeId" element={<EmployeeEditWrapper />} />

            {/* Redirect any unknown routes to dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
