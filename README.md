# Employee Management System

A modern full-stack web application for managing employee information with comprehensive CRUD operations, dashboard analytics, and MongoDB MCP server integration.

## 🏗️ Architecture

- **Backend**: Node.js with Express and MongoDB
- **Frontend**: React with TypeScript
- **Database**: MongoDB (with MCP server integration)
- **MCP Servers**: MongoDB MCP + Browser MCP

## 🚀 Quick Start

### Prerequisites

- Node.js (v16+)
- Python (v3.8+)
- MongoDB (local or Atlas)

### 1. Setup MCP Servers

**Windows:**
```bash
setup-mcp.bat
```

**Linux/Mac:**
```bash
chmod +x setup-mcp.sh
./setup-mcp.sh
```

### 2. Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Update .env with your MongoDB URI
uvicorn main:app --reload
```

### 3. Access the API

- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health
- **Base API**: http://localhost:8000/api/v1

## 📊 API Endpoints

### Employee Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/employees/` | Create new employee |
| GET | `/api/v1/employees/` | Get all employees |
| GET | `/api/v1/employees/{id}` | Get employee by ID |
| PUT | `/api/v1/employees/{id}` | Update employee |
| DELETE | `/api/v1/employees/{id}` | Delete employee |
| GET | `/api/v1/employees/dashboard` | Get dashboard stats |

### Employee Data Model

```json
{
  "employee_id": "EMP001",
  "name": "John Doe",
  "age": 30,
  "department": "Engineering",
  "created_at": "2025-08-17T10:30:00.000Z",
  "updated_at": "2025-08-17T10:30:00.000Z"
}
```

## 🔧 MCP Configuration

The `mcp-config.json` file configures both MongoDB and Browser MCP servers:

```json
{
  "mcpServers": {
    "mongodb": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-mongodb"],
      "env": {
        "MONGODB_URI": "mongodb://localhost:27017/employee_management"
      }
    },
    "browser": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-browser"]
    }
  }
}
```

## 🗄️ Database Schema

### Collections

- **employees**: Main employee data collection

### Indexes

- Unique index on `employee_id`
- Index on `department`
- Index on `created_at` (descending)
- Compound index on `created_at` + `department`

## 🧪 Testing the API

### Create Employee
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

### Get All Employees
```bash
curl "http://localhost:8000/api/v1/employees/"
```

### Get Dashboard Stats
```bash
curl "http://localhost:8000/api/v1/employees/dashboard"
```

## 📁 Project Structure

```
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   ├── core/
│   │   ├── models/
│   │   └── services/
│   ├── main.py
│   └── requirements.txt
├── prd/                    # Product Requirements Documentation
├── mcp-config.json        # MCP server configuration
├── package.json           # Project metadata
└── README.md
```

## 🔍 MongoDB MCP Usage

With the MongoDB MCP server running, you can:

1. **Query employees directly through MCP**
2. **Perform database operations via AI assistant**
3. **Monitor database performance**
4. **Execute aggregation pipelines**

## 🌐 Browser MCP Usage

The Browser MCP server enables:

1. **Web scraping capabilities**
2. **Automated testing of the frontend**
3. **Integration with web-based MongoDB tools**
4. **Documentation browsing**

## 🚧 Next Steps

1. **Frontend Development**: React TypeScript application
2. **Authentication**: User login and authorization
3. **Advanced Features**: File uploads, reporting
4. **Deployment**: Docker containerization

## 📞 Support

For questions about this Employee Management System:
- **Author**: Azmil (Candidate)
- **Company**: LeadAlways Technology (M) Sdn Bhd
- **Assignment**: Assistant Web Dev Developer (Work-Based Learning)
