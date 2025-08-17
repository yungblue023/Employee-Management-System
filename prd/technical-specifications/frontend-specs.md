# Frontend Specifications
# Employee Management System - React TypeScript

**Version**: 1.0  
**Date**: August 17, 2025  
**Framework**: React 18+ with TypeScript  

---

## 1. Technology Stack

### 1.1 Core Technologies
- **Framework**: React 18.2+
- **Language**: TypeScript 4.9+
- **Build Tool**: Create React App / Vite
- **Package Manager**: npm / yarn

### 1.2 Key Dependencies
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.8.0",
  "typescript": "^4.9.5",
  "axios": "^1.6.0",
  "recharts": "^2.8.0"
}
```

### 1.3 Development Dependencies
```json
{
  "@types/react": "^18.2.0",
  "@types/react-dom": "^18.2.0",
  "@testing-library/react": "^13.4.0",
  "@testing-library/jest-dom": "^5.16.4"
}
```

---

## 2. Project Structure

### 2.1 Directory Structure
```
src/
├── components/
│   ├── Common/
│   │   ├── Layout.tsx
│   │   ├── Navigation.tsx
│   │   └── Loading.tsx
│   ├── Dashboard/
│   │   ├── Dashboard.tsx
│   │   ├── StatCard.tsx
│   │   └── Charts/
│   │       ├── DepartmentChart.tsx
│   │       └── AgeDistributionChart.tsx
│   └── EmployeeManagement/
│       ├── EmployeeManagement.tsx
│       ├── EmployeeList.tsx
│       ├── EmployeeForm.tsx
│       └── EmployeeCard.tsx
├── services/
│   ├── employeeService.ts
│   └── apiClient.ts
├── types/
│   ├── employee.ts
│   └── api.ts
├── utils/
│   ├── dateUtils.ts
│   ├── validation.ts
│   └── constants.ts
├── hooks/
│   ├── useEmployees.ts
│   └── useApi.ts
├── styles/
│   ├── globals.css
│   ├── components.css
│   └── responsive.css
├── App.tsx
├── index.tsx
└── setupTests.ts
```

---

## 3. TypeScript Interfaces

### 3.1 Employee Types
```typescript
// types/employee.ts
export interface Employee {
  employee_id: string;
  name: string;
  age: number;
  department: string;
  created_at: string;
  updated_at: string;
}

export interface EmployeeCreate {
  employee_id: string;
  name: string;
  age: number;
  department: string;
}

export interface EmployeeUpdate {
  name?: string;
  age?: number;
  department?: string;
}

export interface EmployeeStats {
  total: number;
  recentlyAdded: number;
  departments: { [key: string]: number };
  averageAge: number;
}
```

### 3.2 API Types
```typescript
// types/api.ts
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  detail: string;
  status?: number;
}

export interface PaginationParams {
  skip?: number;
  limit?: number;
}
```

---

## 4. Component Specifications

### 4.1 Dashboard Component

#### 4.1.1 Dashboard.tsx
**Purpose**: Main dashboard displaying employee statistics and charts

**Props**: None

**State**:
```typescript
interface DashboardState {
  employees: Employee[];
  recentEmployees: Employee[];
  stats: EmployeeStats;
  loading: boolean;
  error: string | null;
}
```

**Features**:
- Employee statistics cards (total, recent, departments, average age)
- Department distribution chart
- Age group distribution chart
- Recent employees list (last 3 months)
- Real-time data updates

#### 4.1.2 StatCard.tsx
**Purpose**: Reusable statistics card component

**Props**:
```typescript
interface StatCardProps {
  title: string;
  value: number | string;
  icon: string;
  color?: string;
  subtitle?: string;
}
```

### 4.2 Employee Management Components

#### 4.2.1 EmployeeManagement.tsx
**Purpose**: Main employee management interface

**Features**:
- Employee list with search and filter
- Add new employee button
- Edit/Delete employee actions
- Pagination support
- Bulk operations (future enhancement)

#### 4.2.2 EmployeeList.tsx
**Purpose**: Display employees in table/card format

**Props**:
```typescript
interface EmployeeListProps {
  employees: Employee[];
  onEdit: (employee: Employee) => void;
  onDelete: (employeeId: string) => void;
  loading?: boolean;
}
```

**Features**:
- Responsive table/card layout
- Sort by columns
- Search functionality
- Filter by department
- Pagination controls

#### 4.2.3 EmployeeForm.tsx
**Purpose**: Add/Edit employee modal form

**Props**:
```typescript
interface EmployeeFormProps {
  employee?: Employee | null;
  onSubmit: (data: EmployeeCreate | EmployeeUpdate) => Promise<void>;
  onClose: () => void;
  isOpen: boolean;
}
```

**Features**:
- Form validation
- Error handling
- Loading states
- Auto-generate Employee ID option
- Department dropdown

---

## 5. Services and API Integration

### 5.1 Employee Service
```typescript
// services/employeeService.ts
class EmployeeService {
  private apiClient: AxiosInstance;

  constructor() {
    this.apiClient = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  async getAllEmployees(): Promise<Employee[]> { /* ... */ }
  async getEmployeeById(id: string): Promise<Employee> { /* ... */ }
  async createEmployee(employee: EmployeeCreate): Promise<Employee> { /* ... */ }
  async updateEmployee(id: string, employee: EmployeeUpdate): Promise<Employee> { /* ... */ }
  async deleteEmployee(id: string): Promise<void> { /* ... */ }
  async getEmployeeStats(): Promise<EmployeeStats> { /* ... */ }
}

export const employeeService = new EmployeeService();
```

### 5.2 Custom Hooks

#### 5.2.1 useEmployees Hook
```typescript
// hooks/useEmployees.ts
export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = async () => { /* ... */ };
  const createEmployee = async (data: EmployeeCreate) => { /* ... */ };
  const updateEmployee = async (id: string, data: EmployeeUpdate) => { /* ... */ };
  const deleteEmployee = async (id: string) => { /* ... */ };

  return {
    employees,
    loading,
    error,
    fetchEmployees,
    createEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
```

---

## 6. Styling and UI Design

### 6.1 Design System

#### 6.1.1 Color Palette
```css
:root {
  /* Primary Colors */
  --primary-blue: #3498db;
  --primary-dark: #2c3e50;
  --primary-light: #ecf0f1;

  /* Secondary Colors */
  --success-green: #2ecc71;
  --warning-orange: #f39c12;
  --danger-red: #e74c3c;
  --info-blue: #3498db;

  /* Neutral Colors */
  --gray-100: #f8f9fa;
  --gray-200: #e9ecef;
  --gray-300: #dee2e6;
  --gray-400: #ced4da;
  --gray-500: #adb5bd;
  --gray-600: #6c757d;
  --gray-700: #495057;
  --gray-800: #343a40;
  --gray-900: #212529;
}
```

#### 6.1.2 Typography
```css
/* Font Stack */
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
               'Oxygen', 'Ubuntu', 'Cantarell', 'Helvetica Neue', sans-serif;
}

/* Heading Styles */
h1 { font-size: 2.5rem; font-weight: 600; }
h2 { font-size: 2rem; font-weight: 600; }
h3 { font-size: 1.5rem; font-weight: 600; }
h4 { font-size: 1.25rem; font-weight: 500; }
```

### 6.2 Component Styling

#### 6.2.1 Button Styles
```css
.btn {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.btn-success {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.btn-danger {
  background: linear-gradient(135deg, #e74c3c, #c0392b);
  color: white;
}
```

#### 6.2.2 Card Styles
```css
.card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 24px;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.15);
}
```

---

## 7. Responsive Design

### 7.1 Breakpoints
```css
/* Mobile First Approach */
@media (min-width: 576px) { /* Small devices */ }
@media (min-width: 768px) { /* Medium devices */ }
@media (min-width: 992px) { /* Large devices */ }
@media (min-width: 1200px) { /* Extra large devices */ }
```

### 7.2 Layout Adaptations

#### 7.2.1 Dashboard Layout
- **Desktop**: 4-column stats grid, side-by-side charts
- **Tablet**: 2-column stats grid, stacked charts
- **Mobile**: Single column layout, simplified charts

#### 7.2.2 Employee List
- **Desktop**: Full table view with all columns
- **Tablet**: Condensed table with essential columns
- **Mobile**: Card-based layout with key information

---

## 8. State Management

### 8.1 Local State (useState)
- Component-specific UI state
- Form data and validation
- Loading and error states

### 8.2 Context API (Future Enhancement)
```typescript
// contexts/EmployeeContext.tsx
interface EmployeeContextType {
  employees: Employee[];
  stats: EmployeeStats;
  loading: boolean;
  error: string | null;
  actions: {
    fetchEmployees: () => Promise<void>;
    createEmployee: (data: EmployeeCreate) => Promise<void>;
    updateEmployee: (id: string, data: EmployeeUpdate) => Promise<void>;
    deleteEmployee: (id: string) => Promise<void>;
  };
}
```

---

## 9. Form Validation

### 9.1 Validation Rules
```typescript
// utils/validation.ts
export const validateEmployee = (data: EmployeeCreate | EmployeeUpdate) => {
  const errors: { [key: string]: string } = {};

  // Employee ID validation (for create)
  if ('employee_id' in data && !data.employee_id) {
    errors.employee_id = 'Employee ID is required';
  } else if ('employee_id' in data && !/^EMP\d{3,}$/i.test(data.employee_id)) {
    errors.employee_id = 'Employee ID must start with "EMP" followed by numbers';
  }

  // Name validation
  if (!data.name?.trim()) {
    errors.name = 'Name is required';
  } else if (data.name.length < 2 || data.name.length > 100) {
    errors.name = 'Name must be between 2 and 100 characters';
  }

  // Age validation
  if (!data.age) {
    errors.age = 'Age is required';
  } else if (data.age < 18 || data.age > 100) {
    errors.age = 'Age must be between 18 and 100';
  }

  // Department validation
  if (!data.department?.trim()) {
    errors.department = 'Department is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
```

---

## 10. Error Handling

### 10.1 Error Boundary Component
```typescript
// components/Common/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

### 10.2 API Error Handling
```typescript
// services/apiClient.ts
const handleApiError = (error: AxiosError): never => {
  if (error.response) {
    // Server responded with error status
    const message = error.response.data?.detail || 'Server error occurred';
    throw new Error(message);
  } else if (error.request) {
    // Request made but no response received
    throw new Error('Network error - please check your connection');
  } else {
    // Something else happened
    throw new Error('An unexpected error occurred');
  }
};
```

---

## 11. Testing Strategy

### 11.1 Unit Testing
- Component rendering tests
- User interaction tests
- Utility function tests
- Custom hook tests

### 11.2 Integration Testing
- API integration tests
- Form submission tests
- Navigation tests
- Error handling tests

### 11.3 Example Test
```typescript
// components/__tests__/EmployeeForm.test.tsx
describe('EmployeeForm', () => {
  it('should validate required fields', async () => {
    render(<EmployeeForm onSubmit={jest.fn()} onClose={jest.fn()} isOpen={true} />);
    
    const submitButton = screen.getByText('Create Employee');
    fireEvent.click(submitButton);
    
    expect(screen.getByText('Employee ID is required')).toBeInTheDocument();
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.getByText('Age is required')).toBeInTheDocument();
    expect(screen.getByText('Department is required')).toBeInTheDocument();
  });
});
```

---

## 12. Performance Optimization

### 12.1 Code Splitting
```typescript
// Lazy loading components
const Dashboard = lazy(() => import('./components/Dashboard/Dashboard'));
const EmployeeManagement = lazy(() => import('./components/EmployeeManagement/EmployeeManagement'));
```

### 12.2 Memoization
```typescript
// Memoize expensive calculations
const employeeStats = useMemo(() => {
  return calculateEmployeeStats(employees);
}, [employees]);

// Memoize callback functions
const handleEmployeeUpdate = useCallback((id: string, data: EmployeeUpdate) => {
  return updateEmployee(id, data);
}, [updateEmployee]);
```

### 12.3 Virtual Scrolling (Future Enhancement)
- Implement for large employee lists
- Use libraries like react-window or react-virtualized
