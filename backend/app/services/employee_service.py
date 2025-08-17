from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status

from app.core.database import get_database
from app.models.employee import EmployeeCreate, EmployeeUpdate, EmployeeResponse, DashboardStats

class EmployeeService:
    """Service class for employee operations"""
    
    @staticmethod
    async def create_employee(employee_data: EmployeeCreate) -> EmployeeResponse:
        """Create a new employee"""
        database = await get_database()
        
        # Prepare employee document
        employee_doc = {
            "employee_id": employee_data.employee_id,
            "name": employee_data.name,
            "age": employee_data.age,
            "department": employee_data.department,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        
        try:
            # Insert employee
            result = await database.employees.insert_one(employee_doc)
            
            # Retrieve created employee
            created_employee = await database.employees.find_one({"_id": result.inserted_id})
            
            return EmployeeResponse(**created_employee, id=str(created_employee["_id"]))
            
        except DuplicateKeyError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Employee with ID {employee_data.employee_id} already exists"
            )
    
    @staticmethod
    async def get_all_employees(skip: int = 0, limit: int = 20) -> List[EmployeeResponse]:
        """Get all employees with pagination"""
        database = await get_database()
        
        cursor = database.employees.find({}).sort("created_at", -1).skip(skip).limit(limit)
        employees = await cursor.to_list(length=limit)
        
        return [
            EmployeeResponse(**emp, id=str(emp["_id"])) 
            for emp in employees
        ]
    
    @staticmethod
    async def get_employee_by_id(employee_id: str) -> Optional[EmployeeResponse]:
        """Get employee by employee_id"""
        database = await get_database()
        
        employee = await database.employees.find_one({"employee_id": employee_id})
        
        if employee:
            return EmployeeResponse(**employee, id=str(employee["_id"]))
        return None
    
    @staticmethod
    async def update_employee(employee_id: str, employee_data: EmployeeUpdate) -> Optional[EmployeeResponse]:
        """Update an employee"""
        database = await get_database()
        
        # Prepare update data
        update_data = {k: v for k, v in employee_data.dict().items() if v is not None}
        
        if not update_data:
            # No fields to update
            return await EmployeeService.get_employee_by_id(employee_id)
        
        update_data["updated_at"] = datetime.utcnow()
        
        # Update employee
        result = await database.employees.update_one(
            {"employee_id": employee_id},
            {"$set": update_data}
        )
        
        if result.matched_count == 0:
            return None
        
        # Return updated employee
        return await EmployeeService.get_employee_by_id(employee_id)
    
    @staticmethod
    async def delete_employee(employee_id: str) -> bool:
        """Delete an employee"""
        database = await get_database()
        
        result = await database.employees.delete_one({"employee_id": employee_id})
        return result.deleted_count > 0
    
    @staticmethod
    async def get_dashboard_stats() -> DashboardStats:
        """Get dashboard statistics"""
        database = await get_database()
        
        # Total employees
        total_employees = await database.employees.count_documents({})
        
        # Recent employees (last 3 months)
        three_months_ago = datetime.utcnow() - timedelta(days=90)
        recent_employees = await database.employees.count_documents({
            "created_at": {"$gte": three_months_ago}
        })
        
        # Department distribution
        dept_pipeline = [
            {"$group": {"_id": "$department", "count": {"$sum": 1}}},
            {"$sort": {"count": -1}}
        ]
        dept_cursor = database.employees.aggregate(dept_pipeline)
        dept_results = await dept_cursor.to_list(length=None)
        department_distribution = {item["_id"]: item["count"] for item in dept_results}
        
        # Monthly additions (last 12 months)
        monthly_pipeline = [
            {
                "$match": {
                    "created_at": {"$gte": datetime.utcnow() - timedelta(days=365)}
                }
            },
            {
                "$group": {
                    "_id": {
                        "year": {"$year": "$created_at"},
                        "month": {"$month": "$created_at"}
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.year": 1, "_id.month": 1}}
        ]
        monthly_cursor = database.employees.aggregate(monthly_pipeline)
        monthly_results = await monthly_cursor.to_list(length=None)
        monthly_additions = [
            {
                "year": item["_id"]["year"],
                "month": item["_id"]["month"],
                "count": item["count"]
            }
            for item in monthly_results
        ]
        
        return DashboardStats(
            total_employees=total_employees,
            recent_employees=recent_employees,
            department_distribution=department_distribution,
            monthly_additions=monthly_additions
        )
