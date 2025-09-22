/**
 * Header component with navigation using React Router and authentication
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AuthService } from '../services/auth';

const Header: React.FC = () => {
  const location = useLocation();
  const currentUser = AuthService.getCurrentUser();

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      AuthService.logout();
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>Employee Management System</h1>
        </div>

        <nav className="navigation">
          <Link
            to="/dashboard"
            className={`nav-button ${(location.pathname === '/' || location.pathname === '/dashboard') ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link
            to="/employees"
            className={`nav-button ${location.pathname === '/employees' ? 'active' : ''}`}
          >
            Employees
          </Link>
        </nav>

        <div className="user-section">
          <span className="user-name">
            Welcome, {currentUser?.full_name || currentUser?.username || 'User'}
          </span>
          <button
            onClick={handleLogout}
            className="logout-button"
            title="Logout"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
