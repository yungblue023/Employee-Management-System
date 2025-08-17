import React from 'react';

type View = 'dashboard' | 'employees';

interface HeaderProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  return (
    <header className="header">
      <div className="header-content">
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); onViewChange('dashboard'); }}>
          Employee Management System
        </a>
        
        <nav className="nav">
          <a
            href="#"
            className={`nav-link ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onViewChange('dashboard');
            }}
          >
            Dashboard
          </a>
          <a
            href="#"
            className={`nav-link ${currentView === 'employees' ? 'active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              onViewChange('employees');
            }}
          >
            Employees
          </a>
        </nav>
      </div>
    </header>
  );
};

export default Header;
