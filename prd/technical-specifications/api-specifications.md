# API Specifications
# Employee Management System

**Version**: 1.0  
**Date**: August 17, 2025  
**Base URL**: `http://localhost:8000`  

---

## 1. API Overview

### 1.1 Technology Stack
- **Framework**: FastAPI
- **Database**: MongoDB
- **Validation**: Pydantic
- **Documentation**: OpenAPI/Swagger

### 1.2 Base Configuration
- **Base URL**: `http://localhost:8000`
- **API Prefix**: `/api/v1`
- **Content-Type**: `application/json`
- **CORS**: Enabled for frontend integration

---

## 2. Data Models

### 2.1 Employee Models

#### EmployeeBase
```python
class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=18, le=100)
    department: str = Field(..., min_length=2, max_length=50)
```

#### EmployeeCreate
```python
class EmployeeCreate(EmployeeBase):
    employee_id: str = Field(..., min_length=3, max_length=20)
```

#### EmployeeUpdate
```python
class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=100)
    department: Optional[str] = Field(None, min_length=2, max_length=50)
```

#### EmployeeResponse
```python
class EmployeeResponse(EmployeeBase):
    employee_id: str
    created_at: datetime
    updated_at: datetime
```

---

## 3. API Endpoints

### 3.1 Health Check

#### GET /health
**Description**: Check API health status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-17T10:30:00Z",
  "version": "1.0.0"
}
```

**Status Codes**:
- `200`: API is healthy

---

### 3.2 Employee Management

#### POST /api/v1/employees/
**Description**: Create a new employee

**Request Body**:
```json
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "age": 30,
  "department": "Engineering"
}
```

**Response**:
```json
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "age": 30,
  "department": "Engineering",
  "created_at": "2025-08-17T10:30:00Z",
  "updated_at": "2025-08-17T10:30:00Z"
}
```

**Status Codes**:
- `201`: Employee created successfully
- `400`: Invalid input data or duplicate Employee ID
- `422`: Validation error

**Validation Rules**:
- Employee ID must be unique
- Employee ID format: EMP + numbers (e.g., EMP001)
- Name: 2-100 characters, letters/spaces/dots/hyphens/apostrophes only
- Age: 18-100
- Department: 2-50 characters, non-empty

---

#### GET /api/v1/employees/
**Description**: Retrieve all employees

**Query Parameters**:
- `skip` (optional): Number of records to skip (default: 0)
- `limit` (optional): Maximum records to return (default: 100)

**Response**:
```json
[
  {
    "employee_id": "EMP001",
    "name": "John Doe",
    "age": 30,
    "department": "Engineering",
    "created_at": "2025-08-17T10:30:00Z",
    "updated_at": "2025-08-17T10:30:00Z"
  },
  {
    "employee_id": "EMP002",
    "name": "Jane Smith",
    "age": 28,
    "department": "Marketing",
    "created_at": "2025-08-17T10:35:00Z",
    "updated_at": "2025-08-17T10:35:00Z"
  }
]
```

**Status Codes**:
- `200`: Success
- `500`: Internal server error

---

#### GET /api/v1/employees/{employee_id}
**Description**: Retrieve a specific employee by ID

**Path Parameters**:
- `employee_id`: Unique employee identifier

**Response**:
```json
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "age": 30,
  "department": "Engineering",
  "created_at": "2025-08-17T10:30:00Z",
  "updated_at": "2025-08-17T10:30:00Z"
}
```

**Status Codes**:
- `200`: Employee found
- `404`: Employee not found
- `500`: Internal server error

---

#### PUT /api/v1/employees/{employee_id}
**Description**: Update an existing employee

**Path Parameters**:
- `employee_id`: Unique employee identifier

**Request Body** (all fields optional):
```json
{
  "name": "John Smith",
  "age": 31,
  "department": "Senior Engineering"
}
```

**Response**:
```json
{
  "employee_id": "EMP001",
  "name": "John Smith",
  "age": 31,
  "department": "Senior Engineering",
  "created_at": "2025-08-17T10:30:00Z",
  "updated_at": "2025-08-17T11:00:00Z"
}
```

**Status Codes**:
- `200`: Employee updated successfully
- `400`: Invalid input data or no changes made
- `404`: Employee not found
- `422`: Validation error

---

#### DELETE /api/v1/employees/{employee_id}
**Description**: Delete an employee

**Path Parameters**:
- `employee_id`: Unique employee identifier

**Response**:
```json
{
  "message": "Employee deleted successfully"
}
```

**Status Codes**:
- `200`: Employee deleted successfully
- `404`: Employee not found
- `500`: Internal server error

---

## 4. Error Handling

### 4.1 Error Response Format
```json
{
  "detail": "Error message description"
}
```

### 4.2 Common Error Scenarios

#### Validation Errors (422)
```json
{
  "detail": [
    {
      "loc": ["body", "age"],
      "msg": "ensure this value is greater than or equal to 18",
      "type": "value_error.number.not_ge"
    }
  ]
}
```

#### Duplicate Employee ID (400)
```json
{
  "detail": "Employee with ID EMP001 already exists"
}
```

#### Employee Not Found (404)
```json
{
  "detail": "Employee with ID EMP999 not found"
}
```

---

## 5. Rate Limiting

### 5.1 Limits
- **General API**: 100 requests per 15 minutes per IP
- **Create Operations**: 10 requests per minute per IP

### 5.2 Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1692270000
```

---

## 6. CORS Configuration

### 6.1 Allowed Origins
- `http://localhost:3000` (React development server)
- `http://127.0.0.1:3000`

### 6.2 Allowed Methods
- GET, POST, PUT, DELETE, OPTIONS

### 6.3 Allowed Headers
- Content-Type, Authorization, X-Requested-With

---

## 7. API Documentation

### 7.1 Interactive Documentation
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### 7.2 OpenAPI Schema
- **JSON**: `http://localhost:8000/openapi.json`

---

## 8. Testing

### 8.1 Example cURL Commands

#### Create Employee
```bash
curl -X POST "http://localhost:8000/api/v1/employees/" \
  -H "Content-Type: application/json" \
  -d '{
    "employee_id": "EMP001",
    "name": "John Doe",
    "age": 30,
    "department": "Engineering"
  }'
```

#### Get All Employees
```bash
curl -X GET "http://localhost:8000/api/v1/employees/"
```

#### Update Employee
```bash
curl -X PUT "http://localhost:8000/api/v1/employees/EMP001" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Smith",
    "age": 31
  }'
```

#### Delete Employee
```bash
curl -X DELETE "http://localhost:8000/api/v1/employees/EMP001"
```

---

## 9. Security Considerations

### 9.1 Input Validation
- All inputs validated using Pydantic models
- SQL injection prevention through MongoDB ODM
- XSS prevention through input sanitization

### 9.2 Error Information
- Sensitive information not exposed in error messages
- Generic error messages for security-related failures

### 9.3 Headers
- Security headers implemented via Helmet middleware
- CORS properly configured for known origins only

---

## 10. Performance Considerations

### 10.1 Database Optimization
- Indexes on frequently queried fields
- Efficient query patterns
- Connection pooling

### 10.2 Response Optimization
- Pagination for large datasets
- Selective field returns
- Caching strategies for static data

### 10.3 Monitoring
- Request/response logging
- Performance metrics tracking
- Error rate monitoring
