/**
 * Header component with navigation using React Router
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Header: React.FC = () => {
  const location = useLocation();
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <h1>Employee Management System</h1>
        </div>
        
        <nav className="navigation">
          <Link
            to="/"
            className={`nav-button ${location.pathname === '/' ? 'active' : ''}`}
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
      </div>
    </header>
  );
};

export default Header;
