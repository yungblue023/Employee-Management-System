/**
 * Custom hook for managing breadcrumb navigation state
 * Provides breadcrumb items based on current view and context
 */

import { useMemo } from 'react';
import { BreadcrumbItem } from '../components/Breadcrumb';

export type ViewType = 'dashboard' | 'employees' | 'import' | 'edit';

export interface BreadcrumbContext {
  currentView: ViewType;
  subView?: string;
  employeeId?: string;
  employeeName?: string;
  departmentFilter?: string;
}

interface UseBreadcrumbProps {
  context: BreadcrumbContext;
  onNavigate: (view: ViewType, subView?: string) => void;
}

export const useBreadcrumb = ({ context, onNavigate }: UseBreadcrumbProps): BreadcrumbItem[] => {
  return useMemo(() => {
    const items: BreadcrumbItem[] = [];

    // Always start with Home/Dashboard
    items.push({
      label: 'Home',
      onClick: () => onNavigate('dashboard'),
      isActive: context.currentView === 'dashboard' && !context.subView
    });

    // Add current view if not dashboard
    if (context.currentView === 'employees') {
      items.push({
        label: 'Employees',
        onClick: context.subView ? () => onNavigate('employees') : undefined,
        isActive: !context.subView
      });

      // Add department filter if present
      if (context.departmentFilter) {
        items.push({
          label: `${context.departmentFilter} Department`,
          onClick: context.subView ? () => onNavigate('employees') : undefined
        });
      }

      // Add sub-views
      if (context.subView === 'add') {
        items.push({
          label: 'Add Employee',
          isActive: true
        });
      } else if (context.subView === 'edit' && context.employeeName) {
        items.push({
          label: `Edit ${context.employeeName}`,
          isActive: true
        });
      }
    } else if (context.currentView === 'import') {
      items.push({
        label: 'Import Employees',
        isActive: true
      });
    } else if (context.currentView === 'edit' && context.employeeName) {
      items.push({
        label: 'Employees',
        onClick: () => onNavigate('employees')
      });
      items.push({
        label: `Edit ${context.employeeName}`,
        isActive: true
      });
    }

    return items;
  }, [context, onNavigate]);
};

// Helper functions to create breadcrumb items for different scenarios
export const createBreadcrumbItems = {
  dashboard: (onNavigate: (view: ViewType) => void): BreadcrumbItem[] => [
    {
      label: 'Home',
      isActive: true
    }
  ],

  employees: (onNavigate: (view: ViewType) => void): BreadcrumbItem[] => [
    {
      label: 'Home',
      onClick: () => onNavigate('dashboard')
    },
    {
      label: 'Employees',
      isActive: true
    }
  ],

  employeeAdd: (onNavigate: (view: ViewType) => void): BreadcrumbItem[] => [
    {
      label: 'Home',
      onClick: () => onNavigate('dashboard')
    },
    {
      label: 'Employees',
      onClick: () => onNavigate('employees')
    },
    {
      label: 'Add Employee',
      isActive: true
    }
  ],

  employeeEdit: (onNavigate: (view: ViewType) => void, employeeName: string): BreadcrumbItem[] => [
    {
      label: 'Home',
      onClick: () => onNavigate('dashboard')
    },
    {
      label: 'Employees',
      onClick: () => onNavigate('employees')
    },
    {
      label: `Edit ${employeeName}`,
      isActive: true
    }
  ],

  employeeImport: (onNavigate: (view: ViewType) => void): BreadcrumbItem[] => [
    {
      label: 'Home',
      onClick: () => onNavigate('dashboard')
    },
    {
      label: 'Employees',
      onClick: () => onNavigate('employees')
    },
    {
      label: 'Import Employees',
      isActive: true
    }
  ],

  departmentFilter: (onNavigate: (view: ViewType) => void, department: string): BreadcrumbItem[] => [
    {
      label: 'Home',
      onClick: () => onNavigate('dashboard')
    },
    {
      label: 'Employees',
      onClick: () => onNavigate('employees')
    },
    {
      label: `${department} Department`,
      isActive: true
    }
  ]
};

// Hook for URL-based breadcrumbs (if using React Router)
export const useUrlBreadcrumb = (pathname: string): BreadcrumbItem[] => {
  return useMemo(() => {
    const segments = pathname.split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [];

    // Handle dashboard routes (both / and /dashboard)
    const isDashboard = pathname === '/' || pathname === '/dashboard';

    // Always start with dashboard
    items.push({
      label: 'Dashboard',
      path: '/',
      isActive: isDashboard
    });

    // If we're on /dashboard specifically, we're done
    if (pathname === '/dashboard') {
      return items;
    }

    // Build breadcrumb from URL segments (skip if we're on root dashboard)
    if (!isDashboard) {
      let currentPath = '';
      segments.forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === segments.length - 1;

        // Convert segment to readable label
        let label = segment.charAt(0).toUpperCase() + segment.slice(1);
        if (segment === 'employees') {
          label = 'Employees';
        } else if (segment === 'add') {
          label = 'Add Employee';
        } else if (segment === 'edit') {
          label = 'Edit Employee';
        } else if (segment === 'import') {
          label = 'Import Employees';
        } else if (segment === 'dashboard') {
          // Skip dashboard segment as it's already handled above
          return;
        }

        items.push({
          label,
          path: currentPath,
          isActive: isLast
        });
      });
    }

    return items;
  }, [pathname]);
};

export default useBreadcrumb;
