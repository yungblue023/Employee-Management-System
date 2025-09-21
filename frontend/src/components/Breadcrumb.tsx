/**
 * Breadcrumb navigation component for Employee Management System
 * Provides hierarchical navigation with clickable path segments
 */

import React from 'react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
  isActive?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  separator?: string;
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ 
  items, 
  separator = '/', 
  className = '' 
}) => {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className={`breadcrumb-nav ${className}`} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isClickable = item.onClick && !isLast && !item.isActive;

          return (
            <li 
              key={index} 
              className={`breadcrumb-item ${item.isActive ? 'active' : ''} ${isLast ? 'last' : ''}`}
            >
              {isClickable ? (
                <button
                  type="button"
                  className="breadcrumb-link"
                  onClick={item.onClick}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  {item.label}
                </button>
              ) : (
                <span 
                  className={`breadcrumb-text ${item.isActive ? 'current' : ''}`}
                  aria-current={item.isActive ? 'page' : undefined}
                >
                  {item.label}
                </span>
              )}
              
              {!isLast && (
                <span className="breadcrumb-separator" aria-hidden="true">
                  {separator}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default Breadcrumb;

// CSS styles (to be added to App.css or a separate CSS file)
export const breadcrumbStyles = `
.breadcrumb-nav {
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
  background-color: #f8f9fa;
  border-radius: 0.375rem;
  border: 1px solid #e9ecef;
}

.breadcrumb-list {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
  gap: 0.25rem;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  line-height: 1.5;
}

.breadcrumb-link {
  background: none;
  border: none;
  padding: 0;
  color: #0d6efd;
  text-decoration: none;
  cursor: pointer;
  font-size: inherit;
  font-family: inherit;
  transition: color 0.15s ease-in-out;
}

.breadcrumb-link:hover {
  color: #0a58ca;
  text-decoration: underline;
}

.breadcrumb-link:focus {
  outline: 2px solid #0d6efd;
  outline-offset: 2px;
  border-radius: 2px;
}

.breadcrumb-text {
  color: #6c757d;
}

.breadcrumb-text.current {
  color: #495057;
  font-weight: 500;
}

.breadcrumb-item.active .breadcrumb-text {
  color: #495057;
  font-weight: 500;
}

.breadcrumb-separator {
  margin: 0 0.5rem;
  color: #6c757d;
  user-select: none;
}

/* Responsive design */
@media (max-width: 768px) {
  .breadcrumb-nav {
    padding: 0.5rem 0.75rem;
  }
  
  .breadcrumb-item {
    font-size: 0.8rem;
  }
  
  .breadcrumb-separator {
    margin: 0 0.25rem;
  }
}

/* Dark theme support */
@media (prefers-color-scheme: dark) {
  .breadcrumb-nav {
    background-color: #343a40;
    border-color: #495057;
  }
  
  .breadcrumb-link {
    color: #6ea8fe;
  }
  
  .breadcrumb-link:hover {
    color: #9ec5fe;
  }
  
  .breadcrumb-text {
    color: #adb5bd;
  }
  
  .breadcrumb-text.current {
    color: #f8f9fa;
  }
  
  .breadcrumb-separator {
    color: #adb5bd;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .breadcrumb-nav {
    border-width: 2px;
  }
  
  .breadcrumb-link {
    font-weight: 600;
  }
  
  .breadcrumb-link:focus {
    outline-width: 3px;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .breadcrumb-link {
    transition: none;
  }
}
`;
