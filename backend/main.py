"""
Employee Management System - FastAPI Backend
Complete backend application that connects to MongoDB and serves the React frontend
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta
import os
from bson import ObjectId
import re
import csv
import io

# MongoDB connection string from our MCP testing
MONGODB_URL = "mongodb+srv://yungblue023:yungblueazmildagoat369@project.unql5fh.mongodb.net/mcp_test?retryWrites=true&w=majority&appName=Project"
DATABASE_NAME = "mcp_test"
COLLECTION_NAME = "employees"

# Global MongoDB client
client = None
database = None

# Pydantic models
class EmployeeAttachment(BaseModel):
    id: str
    filename: str
    originalName: str
    size: int
    mimeType: str
    uploadedAt: str
    employeeId: str

class EmployeeBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=18, le=100)
    department: str = Field(..., min_length=2, max_length=50)
    salary: Optional[int] = Field(None, ge=0, le=1000000)
    hire_date: Optional[str] = None
    status: Optional[str] = Field("active", pattern="^(active|on_leave|inactive)$")
    skills: Optional[List[str]] = []

class EmployeeCreate(EmployeeBase):
    employee_id: str = Field(..., min_length=3, max_length=20)

class EmployeeUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    age: Optional[int] = Field(None, ge=18, le=100)
    department: Optional[str] = Field(None, min_length=2, max_length=50)
    salary: Optional[int] = Field(None, ge=0, le=1000000)
    hire_date: Optional[str] = None
    status: Optional[str] = Field(None, pattern="^(active|on_leave|inactive)$")
    skills: Optional[List[str]] = None

class EmployeeResponse(EmployeeBase):
    employee_id: str
    files: Optional[List[EmployeeAttachment]] = []
    created_at: datetime
    updated_at: datetime

class DashboardStats(BaseModel):
    total_employees: int
    recent_employees: int
    department_distribution: dict
    salary_stats: dict
    age_demographics: List[dict]
    status_distribution: dict

# Create FastAPI app
app = FastAPI(
    title="Employee Management System API",
    description="Complete API for Employee Management with MongoDB integration",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://10.10.50.101:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection functions
async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        # Test connection
        await client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        # Don't raise the exception, just log it and continue
        # This allows the server to start even if MongoDB is unavailable
        client = None
        database = None

async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    if client:
        client.close()
        print("✅ Disconnected from MongoDB")

# Initialize database connection on first use
async def get_database():
    """Get database connection, initialize if needed"""
    global client, database
    if database is None:
        await connect_to_mongo()
    return database

# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    print("🚀 FastAPI server starting up...")
    await connect_to_mongo()

@app.on_event("shutdown")
async def shutdown_event():
    await close_mongo_connection()

# Helper functions
def validate_employee_id(employee_id: str) -> str:
    """Validate employee ID format"""
    if not re.match(r"^EMP\d{3,}$", employee_id.upper()):
        raise HTTPException(
            status_code=400,
            detail="Employee ID must follow format EMP### (e.g., EMP001)"
        )
    return employee_id.upper()

def serialize_employee(employee: dict) -> dict:
    """Convert MongoDB document to API response format"""
    if employee:
        employee["_id"] = str(employee["_id"])

        # Add mock files data for demonstration (replace with actual file lookup later)
        employee_id = employee.get("employee_id", "")
        if employee_id in ["EMP001", "EMP007", "EMP010", "EMP025"]:
            # Some employees have files for demonstration
            employee["files"] = [
                {
                    "id": f"file_{employee_id}_1",
                    "filename": f"{employee_id}_resume.pdf",
                    "originalName": f"{employee.get('name', 'Employee')}_Resume.pdf",
                    "size": 245760,
                    "mimeType": "application/pdf",
                    "uploadedAt": "2025-01-15T10:30:00Z",
                    "employeeId": employee_id
                }
            ]
            if employee_id == "EMP007":
                # This employee has multiple files
                employee["files"].append({
                    "id": f"file_{employee_id}_2",
                    "filename": f"{employee_id}_certificate.jpg",
                    "originalName": "Professional_Certificate.jpg",
                    "size": 156432,
                    "mimeType": "image/jpeg",
                    "uploadedAt": "2025-01-20T14:15:00Z",
                    "employeeId": employee_id
                })
        else:
            employee["files"] = []

        return employee
    return None

# API Routes
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db = await get_database()
        db_status = "connected" if db else "disconnected"
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy",
        "message": "Employee Management System API is running",
        "database": db_status
    }

@app.get("/api/v1/employees/", response_model=List[EmployeeResponse])
async def get_all_employees(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None)
):
    """Get all employees with optional filtering"""
    try:
        collection = database[COLLECTION_NAME]
        
        # Build filter
        filter_dict = {}
        if department:
            filter_dict["department"] = department
        if status:
            filter_dict["status"] = status
        
        # Query with pagination
        cursor = collection.find(filter_dict).sort("created_at", -1).skip(skip).limit(limit)
        employees = await cursor.to_list(length=limit)
        
        return [serialize_employee(emp) for emp in employees]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve employees: {str(e)}")

@app.post("/api/v1/employees/", response_model=EmployeeResponse, status_code=201)
async def create_employee(employee: EmployeeCreate):
    """Create a new employee"""
    try:
        collection = database[COLLECTION_NAME]
        
        # Validate employee ID
        employee_id = validate_employee_id(employee.employee_id)
        
        # Check if employee ID already exists
        existing = await collection.find_one({"employee_id": employee_id})
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Employee with ID {employee_id} already exists"
            )
        
        # Prepare document
        now = datetime.utcnow()
        employee_dict = employee.dict()
        employee_dict["employee_id"] = employee_id
        employee_dict["created_at"] = now
        employee_dict["updated_at"] = now
        
        # Insert employee
        result = await collection.insert_one(employee_dict)
        
        # Return created employee
        created_employee = await collection.find_one({"_id": result.inserted_id})
        return serialize_employee(created_employee)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

@app.get("/api/v1/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str):
    """Get employee by ID"""
    try:
        collection = database[COLLECTION_NAME]
        employee = await collection.find_one({"employee_id": employee_id.upper()})
        
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        return serialize_employee(employee)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve employee: {str(e)}")

@app.put("/api/v1/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate):
    """Update an existing employee"""
    try:
        collection = database[COLLECTION_NAME]
        
        # Prepare update data
        update_data = {k: v for k, v in employee_update.dict().items() if v is not None}
        
        if not update_data:
            raise HTTPException(
                status_code=400,
                detail="No valid fields provided for update"
            )
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update employee
        result = await collection.update_one(
            {"employee_id": employee_id.upper()},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        # Return updated employee
        updated_employee = await collection.find_one({"employee_id": employee_id.upper()})
        return serialize_employee(updated_employee)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

@app.delete("/api/v1/employees/{employee_id}")
async def delete_employee(employee_id: str):
    """Delete an employee"""
    try:
        collection = database[COLLECTION_NAME]
        
        result = await collection.delete_one({"employee_id": employee_id.upper()})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        return {"message": f"Employee {employee_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete employee: {str(e)}")

@app.get("/api/v1/employees/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        if database is None:
            await connect_to_mongo()
        if database is None:
            raise HTTPException(status_code=500, detail="Database connection not established.")
        collection = database[COLLECTION_NAME]
        # Total employees
        total_employees = await collection.count_documents({})
        # Recent employees (last 3 months)
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        recent_employees = await collection.count_documents({
            "created_at": {"$gte": three_months_ago}
        })
        # Department distribution
        dept_pipeline = [
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        dept_results = await collection.aggregate(dept_pipeline).to_list(length=None)
        department_distribution = {item["_id"]: item["count"] for item in dept_results}
        # Salary statistics
        salary_pipeline = [
            {"$group": {
                "_id": None,
                "avg_salary": {"$avg": "$salary"},
                "min_salary": {"$min": "$salary"},
                "max_salary": {"$max": "$salary"},
                "total_payroll": {"$sum": "$salary"}
            }}
        ]
        salary_results = await collection.aggregate(salary_pipeline).to_list(length=None)
        salary_stats = salary_results[0] if salary_results else {
            "avg_salary": 0, "min_salary": 0, "max_salary": 0, "total_payroll": 0
        }
        # Age demographics
        age_pipeline = [
            {"$bucket": {
                "groupBy": "$age",
                "boundaries": [20, 25, 30, 35, 40, 45],
                "default": "45+",
                "output": {"count": {"$sum": 1}, "avg_salary": {"$avg": "$salary"}}
            }}
        ]
        age_results = await collection.aggregate(age_pipeline).to_list(length=None)
        # Status distribution
        status_pipeline = [
            {"$group": {"_id": "$status", "count": {"$sum": 1}}}
        ]
        status_results = await collection.aggregate(status_pipeline).to_list(length=None)
        status_distribution = {item["_id"] or "unknown": item["count"] for item in status_results}
        return DashboardStats(
            total_employees=total_employees,
            recent_employees=recent_employees,
            department_distribution=department_distribution,
            salary_stats=salary_stats,
            age_demographics=age_results,
            status_distribution=status_distribution
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve dashboard stats: {str(e)}")

@app.get("/api/v1/employees/export/csv")
async def export_employees_csv(
    department: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    min_salary: Optional[int] = Query(None),
    max_salary: Optional[int] = Query(None),
    min_age: Optional[int] = Query(None),
    max_age: Optional[int] = Query(None),
    search: Optional[str] = Query(None)
):
    """Export employees as CSV with optional filtering"""
    try:
        collection = database[COLLECTION_NAME]

        # Build filter
        filter_dict = {}
        if department:
            filter_dict["department"] = department
        if status:
            filter_dict["status"] = status
        if min_salary is not None:
            filter_dict.setdefault("salary", {})["$gte"] = min_salary
        if max_salary is not None:
            filter_dict.setdefault("salary", {})["$lte"] = max_salary
        if min_age is not None:
            filter_dict.setdefault("age", {})["$gte"] = min_age
        if max_age is not None:
            filter_dict.setdefault("age", {})["$lte"] = max_age
        if search:
            filter_dict["$or"] = [
                {"name": {"$regex": search, "$options": "i"}},
                {"employee_id": {"$regex": search, "$options": "i"}},
                {"department": {"$regex": search, "$options": "i"}}
            ]

        # Query employees
        cursor = collection.find(filter_dict).sort("created_at", -1)
        employees = await cursor.to_list(length=None)

        # Create CSV content
        output = io.StringIO()
        writer = csv.writer(output)

        # Write header
        writer.writerow([
            'Employee ID', 'Name', 'Age', 'Department', 'Salary',
            'Hire Date', 'Status', 'Skills', 'Created At', 'Updated At'
        ])

        # Write data
        for emp in employees:
            skills = ', '.join(emp.get('skills', [])) if emp.get('skills') else ''
            writer.writerow([
                emp.get('employee_id', ''),
                emp.get('name', ''),
                emp.get('age', ''),
                emp.get('department', ''),
                emp.get('salary', ''),
                emp.get('hire_date', ''),
                emp.get('status', 'active'),
                skills,
                emp.get('created_at', ''),
                emp.get('updated_at', '')
            ])

        # Create response
        csv_content = output.getvalue()
        output.close()

        # Generate filename with timestamp
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"employees_export_{timestamp}.csv"

        return StreamingResponse(
            io.BytesIO(csv_content.encode('utf-8')),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export employees: {str(e)}")

# Serve React frontend (for production)
if os.path.exists("../frontend/build"):
    app.mount("/static", StaticFiles(directory="../frontend/build/static"), name="static")
    
    @app.get("/{full_path:path}")
    async def serve_react_app(full_path: str):
        """Serve React app for any unmatched routes"""
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        return FileResponse("../frontend/build/index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
