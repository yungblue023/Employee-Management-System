from pydantic import BaseModel, Field, validator
from typing import Optional
from datetime import datetime
import re

class EmployeeBase(BaseModel):
    """Base employee model with common fields"""
    name: str = Field(..., min_length=2, max_length=100, description="Employee full name")
    age: int = Field(..., ge=18, le=100, description="Employee age")
    department: str = Field(..., min_length=2, max_length=50, description="Employee department")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate name contains only allowed characters"""
        if not re.match(r'^[a-zA-Z\s\.\-\']+$', v.strip()):
            raise ValueError('Name can only contain letters, spaces, dots, hyphens, and apostrophes')
        return v.strip()
    
    @validator('department')
    def validate_department(cls, v):
        """Validate department is not empty after trimming"""
        department = v.strip()
        if not department:
            raise ValueError('Department cannot be empty')
        return department

class EmployeeCreate(EmployeeBase):
    """Model for creating a new employee"""
    employee_id: str = Field(..., min_length=3, max_length=20, description="Unique employee identifier")
    
    @validator('employee_id')
    def validate_employee_id(cls, v):
        """Validate employee ID format (EMP followed by numbers)"""
        if not re.match(r'^EMP\d{3,}$', v.upper()):
            raise ValueError('Employee ID must start with "EMP" followed by at least 3 digits (e.g., EMP001)')
        return v.upper()

class EmployeeUpdate(BaseModel):
    """Model for updating an employee"""
    name: Optional[str] = Field(None, min_length=2, max_length=100, description="Employee full name")
    age: Optional[int] = Field(None, ge=18, le=100, description="Employee age")
    department: Optional[str] = Field(None, min_length=2, max_length=50, description="Employee department")
    
    @validator('name')
    def validate_name(cls, v):
        """Validate name contains only allowed characters"""
        if v is not None:
            if not re.match(r'^[a-zA-Z\s\.\-\']+$', v.strip()):
                raise ValueError('Name can only contain letters, spaces, dots, hyphens, and apostrophes')
            return v.strip()
        return v
    
    @validator('department')
    def validate_department(cls, v):
        """Validate department is not empty after trimming"""
        if v is not None:
            department = v.strip()
            if not department:
                raise ValueError('Department cannot be empty')
            return department
        return v

class EmployeeInDB(EmployeeBase):
    """Model for employee stored in database"""
    employee_id: str
    created_at: datetime
    updated_at: datetime

class EmployeeResponse(EmployeeInDB):
    """Model for employee API response"""
    id: str = Field(alias="_id", description="MongoDB document ID")
    
    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class EmployeeListResponse(BaseModel):
    """Model for employee list API response"""
    employees: list[EmployeeResponse]
    total: int
    page: int = 1
    size: int = 20
    
class DashboardStats(BaseModel):
    """Model for dashboard statistics"""
    total_employees: int
    recent_employees: int  # Last 3 months
    department_distribution: dict[str, int]
    monthly_additions: list[dict]
