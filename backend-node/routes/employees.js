const express = require('express');
const Joi = require('joi');
const { ObjectId } = require('mongodb');

const router = express.Router();

// Validation schemas
const employeeCreateSchema = Joi.object({
    employee_id: Joi.string().pattern(/^EMP\d{3,}$/).required().messages({
        'string.pattern.base': 'Employee ID must start with "EMP" followed by at least 3 digits (e.g., EMP001)'
    }),
    name: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s\.\-']+$/).required().messages({
        'string.pattern.base': 'Name can only contain letters, spaces, dots, hyphens, and apostrophes'
    }),
    age: Joi.number().integer().min(18).max(100).required(),
    department: Joi.string().min(2).max(50).required()
});

const employeeUpdateSchema = Joi.object({
    name: Joi.string().min(2).max(100).pattern(/^[a-zA-Z\s\.\-']+$/).messages({
        'string.pattern.base': 'Name can only contain letters, spaces, dots, hyphens, and apostrophes'
    }),
    age: Joi.number().integer().min(18).max(100),
    department: Joi.string().min(2).max(50)
}).min(1);

// Create employee
router.post('/', async (req, res) => {
    try {
        // Validate input
        const { error, value } = employeeCreateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(d => d.message)
            });
        }

        // Check for duplicate employee_id
        const existingEmployee = req.mockDb.employees.find(
            emp => emp.employee_id === value.employee_id.toUpperCase()
        );

        if (existingEmployee) {
            return res.status(400).json({
                error: 'Duplicate employee ID',
                message: `Employee with ID ${value.employee_id} already exists`
            });
        }

        // Prepare employee document
        const employeeDoc = {
            _id: (req.mockDb.employees.length + 1).toString(),
            employee_id: value.employee_id.toUpperCase(),
            name: value.name.trim(),
            age: value.age,
            department: value.department.trim(),
            created_at: new Date(),
            updated_at: new Date()
        };

        // Add to mock database
        req.mockDb.employees.push(employeeDoc);

        res.status(201).json({
            ...employeeDoc,
            id: employeeDoc._id
        });

    } catch (error) {
        console.error('Create employee error:', error);
        res.status(500).json({
            error: 'Failed to create employee',
            message: error.message
        });
    }
});

// Get all employees
router.get('/', async (req, res) => {
    try {
        const skip = parseInt(req.query.skip) || 0;
        const limit = Math.min(parseInt(req.query.limit) || 20, 100);

        // Sort by created_at descending, then apply pagination
        const sortedEmployees = req.mockDb.employees
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(skip, skip + limit);

        const employeesWithId = sortedEmployees.map(emp => ({
            ...emp,
            id: emp._id
        }));

        res.json(employeesWithId);

    } catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({
            error: 'Failed to retrieve employees',
            message: error.message
        });
    }
});

// Get dashboard statistics
router.get('/dashboard', async (req, res) => {
    try {
        const employees = req.mockDb.employees;

        // Total employees
        const totalEmployees = employees.length;

        // Recent employees (last 3 months)
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const recentEmployees = employees.filter(emp =>
            new Date(emp.created_at) >= threeMonthsAgo
        ).length;

        // Department distribution
        const departmentDistribution = {};
        employees.forEach(emp => {
            departmentDistribution[emp.department] = (departmentDistribution[emp.department] || 0) + 1;
        });

        // Monthly additions (last 12 months)
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

        const monthlyMap = {};
        employees
            .filter(emp => new Date(emp.created_at) >= oneYearAgo)
            .forEach(emp => {
                const date = new Date(emp.created_at);
                const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
                monthlyMap[key] = (monthlyMap[key] || 0) + 1;
            });

        const monthlyAdditions = Object.entries(monthlyMap)
            .map(([key, count]) => {
                const [year, month] = key.split('-');
                return {
                    year: parseInt(year),
                    month: parseInt(month),
                    count: count
                };
            })
            .sort((a, b) => a.year - b.year || a.month - b.month);

        res.json({
            total_employees: totalEmployees,
            recent_employees: recentEmployees,
            department_distribution: departmentDistribution,
            monthly_additions: monthlyAdditions
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            error: 'Failed to retrieve dashboard statistics',
            message: error.message
        });
    }
});

// Get employee by ID
router.get('/:employeeId', async (req, res) => {
    try {
        const employee = req.mockDb.employees.find(emp =>
            emp.employee_id === req.params.employeeId.toUpperCase()
        );

        if (!employee) {
            return res.status(404).json({
                error: 'Employee not found',
                message: `Employee with ID ${req.params.employeeId} not found`
            });
        }

        res.json({
            ...employee,
            id: employee._id
        });

    } catch (error) {
        console.error('Get employee error:', error);
        res.status(500).json({
            error: 'Failed to retrieve employee',
            message: error.message
        });
    }
});

// Update employee
router.put('/:employeeId', async (req, res) => {
    try {
        // Validate input
        const { error, value } = employeeUpdateSchema.validate(req.body);
        if (error) {
            return res.status(400).json({
                error: 'Validation error',
                details: error.details.map(d => d.message)
            });
        }

        // Find employee
        const employeeIndex = req.mockDb.employees.findIndex(emp =>
            emp.employee_id === req.params.employeeId.toUpperCase()
        );

        if (employeeIndex === -1) {
            return res.status(404).json({
                error: 'Employee not found',
                message: `Employee with ID ${req.params.employeeId} not found`
            });
        }

        // Prepare update data
        const updateData = { ...value, updated_at: new Date() };
        if (updateData.name) updateData.name = updateData.name.trim();
        if (updateData.department) updateData.department = updateData.department.trim();

        // Update employee
        req.mockDb.employees[employeeIndex] = {
            ...req.mockDb.employees[employeeIndex],
            ...updateData
        };

        const updatedEmployee = req.mockDb.employees[employeeIndex];

        res.json({
            ...updatedEmployee,
            id: updatedEmployee._id
        });

    } catch (error) {
        console.error('Update employee error:', error);
        res.status(500).json({
            error: 'Failed to update employee',
            message: error.message
        });
    }
});

// Delete employee
router.delete('/:employeeId', async (req, res) => {
    try {
        const employeeIndex = req.mockDb.employees.findIndex(emp =>
            emp.employee_id === req.params.employeeId.toUpperCase()
        );

        if (employeeIndex === -1) {
            return res.status(404).json({
                error: 'Employee not found',
                message: `Employee with ID ${req.params.employeeId} not found`
            });
        }

        // Remove employee from array
        req.mockDb.employees.splice(employeeIndex, 1);

        res.json({
            message: `Employee ${req.params.employeeId} deleted successfully`
        });

    } catch (error) {
        console.error('Delete employee error:', error);
        res.status(500).json({
            error: 'Failed to delete employee',
            message: error.message
        });
    }
});

module.exports = router;
