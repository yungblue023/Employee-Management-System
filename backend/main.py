"""
Employee Management System - FastAPI Backend
Complete backend application that connects to MongoDB and serves the React frontend
"""

from fastapi import FastAPI, HTTPException, Query, UploadFile, File, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from pydantic import BaseModel, Field
from typing import List, Optional, Annotated
from datetime import datetime, timedelta, timezone
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import io
from bson import ObjectId
import re
import csv
import io
import uuid
import shutil
from pathlib import Path

# MongoDB connection string from our MCP testing
MONGODB_URL = "mongodb+srv://yungblue023:yungblueazmildagoat369@project.unql5fh.mongodb.net/mcp_test?retryWrites=true&w=majority&appName=Project"
DATABASE_NAME = "mcp_test"
COLLECTION_NAME = "employees"
FILES_COLLECTION_NAME = "employee_files"

# GridFS will handle file storage in MongoDB

# Authentication Configuration
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Default admin user (in production, store in database)
fake_users_db = {
    "admin": {
        "username": "admin",
        "full_name": "System Administrator",
        "email": "admin@company.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
    }
}

# Global MongoDB client
client = None
database = None
gridfs_bucket = None

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

# Authentication Models
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None

class UserInDB(User):
    hashed_password: str

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
    global client, database, gridfs_bucket
    try:
        client = AsyncIOMotorClient(MONGODB_URL)
        database = client[DATABASE_NAME]
        gridfs_bucket = AsyncIOMotorGridFSBucket(database)
        # Test connection
        await client.admin.command('ping')
        print(f"✅ Connected to MongoDB: {DATABASE_NAME}")
        print(f"✅ GridFS bucket initialized for file storage")
    except Exception as e:
        print(f"❌ Failed to connect to MongoDB: {e}")
        # Don't raise the exception, just log it and continue
        # This allows the server to start even if MongoDB is unavailable
        client = None
        database = None
        gridfs_bucket = None

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

# Authentication Functions
def verify_password(plain_password, hashed_password):
    """Verify a plaintext password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """Hash a password for storing"""
    return pwd_context.hash(password)

def get_user(db, username: str):
    """Get user from database"""
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)

def authenticate_user(fake_db, username: str, password: str):
    """Authenticate user with username and password"""
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get current active user (not disabled)"""
    if current_user.disabled:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Helper functions
def validate_employee_id(employee_id: str) -> str:
    """Validate employee ID format"""
    if not re.match(r"^EMP\d{3,}$", employee_id.upper()):
        raise HTTPException(
            status_code=400,
            detail="Employee ID must follow format EMP### (e.g., EMP001)"
        )
    return employee_id.upper()

async def serialize_employee(employee: dict) -> dict:
    """Convert MongoDB document to API response format"""
    if employee:
        employee["_id"] = str(employee["_id"])

        # Get real files from database
        employee_id = employee.get("employee_id", "")
        files_collection = database[FILES_COLLECTION_NAME]
        files_cursor = files_collection.find({"employeeId": employee_id})
        files = await files_cursor.to_list(length=None)

        # Convert file documents to API format
        employee["files"] = []
        for file_doc in files:
            employee["files"].append({
                "id": str(file_doc["_id"]),
                "filename": file_doc["filename"],
                "originalName": file_doc["originalName"],
                "size": file_doc["size"],
                "mimeType": file_doc["mimeType"],
                "uploadedAt": file_doc["uploadedAt"],
                "employeeId": file_doc["employeeId"]
            })

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

# Authentication Endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
):
    """Login endpoint - returns JWT token for valid credentials"""
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return Token(access_token=access_token, token_type="bearer")

@app.get("/users/me/", response_model=User)
async def read_users_me(
    current_user: Annotated[User, Depends(get_current_active_user)],
):
    """Get current user information"""
    return current_user

@app.get("/api/v1/employees/", response_model=List[EmployeeResponse])
async def get_all_employees(
    current_user: Annotated[User, Depends(get_current_active_user)],
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
        
        return [await serialize_employee(emp) for emp in employees]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve employees: {str(e)}")

@app.post("/api/v1/employees/", response_model=EmployeeResponse, status_code=201)
async def create_employee(
    employee: EmployeeCreate,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
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
        return await serialize_employee(created_employee)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create employee: {str(e)}")

@app.get("/api/v1/employees/{employee_id}", response_model=EmployeeResponse)
async def get_employee(
    employee_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Get employee by ID"""
    try:
        collection = database[COLLECTION_NAME]
        employee = await collection.find_one({"employee_id": employee_id.upper()})
        
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        return await serialize_employee(employee)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve employee: {str(e)}")

@app.put("/api/v1/employees/{employee_id}", response_model=EmployeeResponse)
async def update_employee(
    employee_id: str,
    employee_update: EmployeeUpdate,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
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
        return await serialize_employee(updated_employee)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update employee: {str(e)}")

@app.delete("/api/v1/employees/{employee_id}")
async def delete_employee(
    employee_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
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

# File Management Endpoints
@app.post("/api/v1/employees/{employee_id}/files/upload")
async def upload_file(
    employee_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)],
    file: UploadFile = File(...)
):
    """Upload a file for an employee using GridFS"""
    try:
        # Validate employee exists
        collection = database[COLLECTION_NAME]
        employee = await collection.find_one({"employee_id": employee_id.upper()})
        if not employee:
            raise HTTPException(
                status_code=404,
                detail=f"Employee with ID {employee_id} not found"
            )

        # Validate file size (max 10MB)
        if file.size and file.size > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File size must be less than 10MB"
            )

        # Validate file type
        allowed_types = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ]

        if file.content_type not in allowed_types:
            raise HTTPException(
                status_code=400,
                detail="File type not supported. Please upload PDF, images, or documents."
            )

        # Read file content
        file_content = await file.read()

        # Store file in GridFS
        file_id = await gridfs_bucket.upload_from_stream(
            filename=file.filename,
            source=io.BytesIO(file_content),
            metadata={
                "originalName": file.filename,
                "mimeType": file.content_type,
                "employeeId": employee_id.upper(),
                "uploadedAt": datetime.utcnow().isoformat(),
                "size": len(file_content)
            }
        )

        # Save file metadata to files collection for easy querying
        files_collection = database[FILES_COLLECTION_NAME]
        file_doc = {
            "gridfs_id": str(file_id),
            "filename": file.filename,
            "originalName": file.filename,
            "size": len(file_content),
            "mimeType": file.content_type,
            "uploadedAt": datetime.utcnow().isoformat(),
            "employeeId": employee_id.upper()
        }

        result = await files_collection.insert_one(file_doc)

        return {
            "message": "File uploaded successfully to GridFS",
            "file": {
                "id": str(result.inserted_id),
                "gridfs_id": str(file_id),
                "filename": file_doc["filename"],
                "originalName": file_doc["originalName"],
                "size": file_doc["size"],
                "mimeType": file_doc["mimeType"],
                "uploadedAt": file_doc["uploadedAt"],
                "employeeId": file_doc["employeeId"]
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {str(e)}")

@app.get("/api/v1/employees/{employee_id}/files")
async def get_employee_files(
    employee_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Get all files for an employee"""
    try:
        files_collection = database[FILES_COLLECTION_NAME]
        files_cursor = files_collection.find({"employeeId": employee_id.upper()})
        files = await files_cursor.to_list(length=None)

        return [
            {
                "id": str(file_doc["_id"]),
                "filename": file_doc["filename"],
                "originalName": file_doc["originalName"],
                "size": file_doc["size"],
                "mimeType": file_doc["mimeType"],
                "uploadedAt": file_doc["uploadedAt"],
                "employeeId": file_doc["employeeId"]
            }
            for file_doc in files
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get files: {str(e)}")

@app.get("/api/v1/files/{file_id}/download")
async def download_file(
    file_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Download a file by ID from GridFS"""
    try:
        files_collection = database[FILES_COLLECTION_NAME]
        file_doc = await files_collection.find_one({"_id": ObjectId(file_id)})

        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")

        # Get file from GridFS
        gridfs_id = ObjectId(file_doc["gridfs_id"])

        # Download file content from GridFS
        file_stream = io.BytesIO()
        await gridfs_bucket.download_to_stream(gridfs_id, file_stream)
        file_stream.seek(0)
        file_data = file_stream.read()

        # Properly encode filename for download
        filename = file_doc["originalName"]
        encoded_filename = filename.encode('ascii', 'ignore').decode('ascii')

        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=file_doc["mimeType"],
            headers={
                "Content-Disposition": f'attachment; filename="{encoded_filename}"',
                "Content-Type": file_doc["mimeType"]
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

@app.get("/api/v1/files/{file_id}/preview")
async def preview_file(
    file_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Preview a file by ID from GridFS (for PDFs and images)"""
    try:
        files_collection = database[FILES_COLLECTION_NAME]
        file_doc = await files_collection.find_one({"_id": ObjectId(file_id)})

        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")

        # Only allow preview for certain file types
        if file_doc["mimeType"] not in ['application/pdf', 'image/jpeg', 'image/png', 'image/gif']:
            raise HTTPException(status_code=400, detail="File type not supported for preview")

        # Get file from GridFS
        gridfs_id = ObjectId(file_doc["gridfs_id"])

        # Download file content from GridFS
        file_stream = io.BytesIO()
        await gridfs_bucket.download_to_stream(gridfs_id, file_stream)
        file_stream.seek(0)
        file_data = file_stream.read()

        return StreamingResponse(
            io.BytesIO(file_data),
            media_type=file_doc["mimeType"],
            headers={"Content-Disposition": "inline"}
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to preview file: {str(e)}")

@app.delete("/api/v1/files/{file_id}")
async def delete_file(
    file_id: str,
    current_user: Annotated[User, Depends(get_current_active_user)]
):
    """Delete a file by ID from GridFS"""
    try:
        files_collection = database[FILES_COLLECTION_NAME]
        file_doc = await files_collection.find_one({"_id": ObjectId(file_id)})

        if not file_doc:
            raise HTTPException(status_code=404, detail="File not found")

        # Delete file from GridFS
        gridfs_id = ObjectId(file_doc["gridfs_id"])
        await gridfs_bucket.delete(gridfs_id)

        # Delete file metadata from database
        await files_collection.delete_one({"_id": ObjectId(file_id)})

        return {"message": "File deleted successfully from GridFS"}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")

@app.get("/api/v1/employees/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: Annotated[User, Depends(get_current_active_user)]
):
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
    current_user: Annotated[User, Depends(get_current_active_user)],
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
