const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const employeeRoutes = require('./routes/employees');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('combined'));

// In-memory database (for demo purposes)
const mockDatabase = {
    employees: [
        {
            _id: '1',
            employee_id: 'EMP001',
            name: 'John Doe',
            age: 30,
            department: 'Engineering',
            created_at: new Date('2025-05-17T10:30:00.000Z'),
            updated_at: new Date('2025-05-17T10:30:00.000Z')
        },
        {
            _id: '2',
            employee_id: 'EMP002',
            name: 'Jane Smith',
            age: 28,
            department: 'Marketing',
            created_at: new Date('2025-06-15T14:20:00.000Z'),
            updated_at: new Date('2025-06-15T14:20:00.000Z')
        },
        {
            _id: '3',
            employee_id: 'EMP003',
            name: 'Bob Johnson',
            age: 35,
            department: 'Sales',
            created_at: new Date('2025-07-10T09:15:00.000Z'),
            updated_at: new Date('2025-07-10T09:15:00.000Z')
        },
        {
            _id: '4',
            employee_id: 'EMP004',
            name: 'Alice Brown',
            age: 32,
            department: 'HR',
            created_at: new Date('2025-08-01T11:45:00.000Z'),
            updated_at: new Date('2025-08-01T11:45:00.000Z')
        },
        {
            _id: '5',
            employee_id: 'EMP005',
            name: 'Charlie Wilson',
            age: 29,
            department: 'Finance',
            created_at: new Date('2025-08-10T16:30:00.000Z'),
            updated_at: new Date('2025-08-10T16:30:00.000Z')
        }
    ]
};

// Make mock database available to routes
app.use((req, res, next) => {
    req.mockDb = mockDatabase;
    next();
});

// Routes
app.get('/', (req, res) => {
    res.json({
        message: 'Employee Management System API (Node.js)',
        version: '1.0.0',
        docs: '/api/v1/docs',
        health: '/health'
    });
});

app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        service: 'Employee Management System API (Node.js)',
        version: '1.0.0',
        timestamp: new Date().toISOString()
    });
});

// API routes
app.use('/api/v1/employees', employeeRoutes);

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
    res.json({
        title: 'Employee Management System API',
        version: '1.0.0',
        description: 'API for managing employee information',
        endpoints: {
            'POST /api/v1/employees': 'Create new employee',
            'GET /api/v1/employees': 'Get all employees',
            'GET /api/v1/employees/dashboard': 'Get dashboard statistics',
            'GET /api/v1/employees/{id}': 'Get employee by ID',
            'PUT /api/v1/employees/{id}': 'Update employee',
            'DELETE /api/v1/employees/{id}': 'Delete employee'
        },
        employee_model: {
            employee_id: 'string (EMP001, EMP002, etc.)',
            name: 'string (2-100 chars)',
            age: 'number (18-100)',
            department: 'string (2-50 chars)',
            created_at: 'ISO date string',
            updated_at: 'ISO date string'
        }
    });
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.method} ${req.path} not found`
    });
});

// Start server
function startServer() {
    console.log('🚀 Starting Employee Management System API...');
    console.log('📊 Using in-memory database (demo mode)');
    console.log('💡 To use MongoDB, install and start MongoDB, then restart the server');

    app.listen(PORT, () => {
        console.log(`✅ Employee Management System API running on http://localhost:${PORT}`);
        console.log(`📚 API Documentation: http://localhost:${PORT}/api/v1/docs`);
        console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
        console.log(`🧪 Test API: curl http://localhost:${PORT}/api/v1/employees`);
    });
}

startServer();
