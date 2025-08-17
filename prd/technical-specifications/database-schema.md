# Database Schema Design
# Employee Management System

**Version**: 1.0  
**Date**: August 17, 2025  
**Database**: MongoDB  

---

## 1. Database Overview

### 1.1 Database Information
- **Database Name**: `employee_management`
- **Database Type**: MongoDB (NoSQL Document Database)
- **Connection**: MongoDB Atlas / Local MongoDB instance
- **Driver**: Motor (Async MongoDB driver for Python)

### 1.2 Design Principles
- **Document-oriented**: Leverage MongoDB's flexible document structure
- **Indexing**: Optimize for common query patterns
- **Validation**: Schema validation at application level (Pydantic)
- **Scalability**: Design for horizontal scaling

---

## 2. Collections

### 2.1 employees Collection

#### 2.1.1 Document Structure
```json
{
  "_id": ObjectId("64d5f8a7b8c9d1e2f3a4b5c6"),
  "employee_id": "EMP001",
  "name": "John Doe",
  "age": 30,
  "department": "Engineering",
  "created_at": ISODate("2025-08-17T10:30:00.000Z"),
  "updated_at": ISODate("2025-08-17T10:30:00.000Z")
}
```

#### 2.1.2 Field Specifications

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `_id` | ObjectId | Yes | Yes | MongoDB auto-generated primary key |
| `employee_id` | String | Yes | Yes | Business unique identifier (EMP001, EMP002, etc.) |
| `name` | String | Yes | No | Employee full name (2-100 characters) |
| `age` | Number | Yes | No | Employee age (18-100) |
| `department` | String | Yes | No | Employee department (2-50 characters) |
| `created_at` | Date | Yes | No | Document creation timestamp |
| `updated_at` | Date | Yes | No | Last modification timestamp |

#### 2.1.3 Validation Rules

**employee_id**:
- Pattern: `^EMP\d{3,}$` (EMP followed by 3+ digits)
- Unique across collection
- Case-insensitive uniqueness

**name**:
- Length: 2-100 characters
- Pattern: `^[a-zA-Z\s\.\-']+$` (letters, spaces, dots, hyphens, apostrophes)
- Trimmed of leading/trailing whitespace

**age**:
- Type: Integer
- Range: 18-100 inclusive
- No decimal values allowed

**department**:
- Length: 2-50 characters
- Non-empty after trimming
- Common values: Engineering, Marketing, Sales, HR, Finance, etc.

**created_at / updated_at**:
- ISO Date format
- UTC timezone
- Auto-managed by application

---

## 3. Indexes

### 3.1 Primary Indexes

#### 3.1.1 Unique Index on employee_id
```javascript
db.employees.createIndex(
  { "employee_id": 1 }, 
  { 
    unique: true,
    name: "idx_employee_id_unique"
  }
)
```

**Purpose**: Ensure employee_id uniqueness and fast lookups
**Query Patterns**: 
- Find by employee_id
- Update by employee_id
- Delete by employee_id

### 3.2 Secondary Indexes

#### 3.2.1 Department Index
```javascript
db.employees.createIndex(
  { "department": 1 }, 
  { 
    name: "idx_department"
  }
)
```

**Purpose**: Optimize department-based queries and aggregations
**Query Patterns**:
- Filter employees by department
- Department statistics
- Department-wise employee counts

#### 3.2.2 Created Date Index (Descending)
```javascript
db.employees.createIndex(
  { "created_at": -1 }, 
  { 
    name: "idx_created_at_desc"
  }
)
```

**Purpose**: Optimize time-based queries (recent employees, 3-month filter)
**Query Patterns**:
- Recent employees (last 3 months)
- Chronological employee listing
- Date range queries

#### 3.2.3 Compound Index for Dashboard Queries
```javascript
db.employees.createIndex(
  { 
    "created_at": -1, 
    "department": 1 
  }, 
  { 
    name: "idx_created_dept_compound"
  }
)
```

**Purpose**: Optimize dashboard queries combining date and department filters
**Query Patterns**:
- Recent employees by department
- Dashboard statistics
- Time-series department analysis

---

## 4. Sample Data

### 4.1 Initial Seed Data
```json
[
  {
    "employee_id": "EMP001",
    "name": "John Doe",
    "age": 30,
    "department": "Engineering",
    "created_at": ISODate("2025-05-17T10:30:00.000Z"),
    "updated_at": ISODate("2025-05-17T10:30:00.000Z")
  },
  {
    "employee_id": "EMP002",
    "name": "Jane Smith",
    "age": 28,
    "department": "Marketing",
    "created_at": ISODate("2025-06-15T14:20:00.000Z"),
    "updated_at": ISODate("2025-06-15T14:20:00.000Z")
  },
  {
    "employee_id": "EMP003",
    "name": "Bob Johnson",
    "age": 35,
    "department": "Sales",
    "created_at": ISODate("2025-07-10T09:15:00.000Z"),
    "updated_at": ISODate("2025-07-10T09:15:00.000Z")
  },
  {
    "employee_id": "EMP004",
    "name": "Alice Brown",
    "age": 32,
    "department": "HR",
    "created_at": ISODate("2025-08-01T11:45:00.000Z"),
    "updated_at": ISODate("2025-08-01T11:45:00.000Z")
  },
  {
    "employee_id": "EMP005",
    "name": "Charlie Wilson",
    "age": 29,
    "department": "Finance",
    "created_at": ISODate("2025-08-10T16:30:00.000Z"),
    "updated_at": ISODate("2025-08-10T16:30:00.000Z")
  }
]
```

---

## 5. Query Patterns

### 5.1 Common Queries

#### 5.1.1 Find All Employees (with pagination)
```javascript
db.employees.find({})
  .sort({ created_at: -1 })
  .skip(0)
  .limit(20)
```

#### 5.1.2 Find Employee by ID
```javascript
db.employees.findOne({ employee_id: "EMP001" })
```

#### 5.1.3 Find Employees by Department
```javascript
db.employees.find({ department: "Engineering" })
  .sort({ name: 1 })
```

#### 5.1.4 Find Recent Employees (Last 3 Months)
```javascript
const threeMonthsAgo = new Date();
threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

db.employees.find({
  created_at: { $gte: threeMonthsAgo }
}).sort({ created_at: -1 })
```

### 5.2 Aggregation Queries

#### 5.2.1 Employee Count by Department
```javascript
db.employees.aggregate([
  {
    $group: {
      _id: "$department",
      count: { $sum: 1 }
    }
  },
  {
    $sort: { count: -1 }
  }
])
```

#### 5.2.2 Average Age by Department
```javascript
db.employees.aggregate([
  {
    $group: {
      _id: "$department",
      avgAge: { $avg: "$age" },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { avgAge: -1 }
  }
])
```

#### 5.2.3 Monthly Employee Addition Trend
```javascript
db.employees.aggregate([
  {
    $group: {
      _id: {
        year: { $year: "$created_at" },
        month: { $month: "$created_at" }
      },
      count: { $sum: 1 }
    }
  },
  {
    $sort: { "_id.year": 1, "_id.month": 1 }
  }
])
```

---

## 6. Performance Considerations

### 6.1 Index Usage
- Monitor index usage with `db.employees.getIndexes()`
- Use `explain()` to analyze query performance
- Regular index maintenance and optimization

### 6.2 Query Optimization
- Use projection to limit returned fields
- Implement pagination for large result sets
- Cache frequently accessed data

### 6.3 Connection Management
- Use connection pooling
- Implement proper connection error handling
- Monitor connection metrics

---

## 7. Backup and Recovery

### 7.1 Backup Strategy
- Daily automated backups
- Point-in-time recovery capability
- Cross-region backup replication (for production)

### 7.2 Data Retention
- Maintain audit trail of changes
- Implement soft delete for critical records
- Archive old data based on business requirements

---

## 8. Security Considerations

### 8.1 Access Control
- Database user with minimal required permissions
- Network-level access restrictions
- Connection string security (environment variables)

### 8.2 Data Protection
- Encryption at rest (MongoDB Atlas default)
- Encryption in transit (TLS/SSL)
- Input validation to prevent injection attacks

### 8.3 Audit Trail
- Log all database operations
- Track user actions and changes
- Implement change history tracking

---

## 9. Monitoring and Maintenance

### 9.1 Performance Monitoring
- Query performance metrics
- Index usage statistics
- Connection pool monitoring

### 9.2 Health Checks
- Database connectivity checks
- Collection size monitoring
- Index health verification

### 9.3 Maintenance Tasks
- Regular index optimization
- Database statistics updates
- Performance tuning based on usage patterns
