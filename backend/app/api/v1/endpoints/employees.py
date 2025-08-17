from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from fastapi.responses import JSONResponse

from app.models.employee import (
    EmployeeCreate, 
    EmployeeUpdate, 
    EmployeeResponse, 
    DashboardStats
)
from app.services.employee_service import EmployeeService

router = APIRouter()

@router.post("/", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
async def create_employee(employee: EmployeeCreate):
    """
    Create a new employee
    
    - **employee_id**: Unique identifier (format: EMP001, EMP002, etc.)
    - **name**: Employee full name (2-100 characters)
    - **age**: Employee age (18-100)
    - **department**: Employee department (2-50 characters)
    """
    try:
        return await EmployeeService.create_employee(employee)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create employee: {str(e)}"
        )

@router.get("/", response_model=List[EmployeeResponse])
async def get_all_employees(
    skip: int = Query(0, ge=0, description="Number of employees to skip"),
    limit: int = Query(20, ge=1, le=100, description="Number of employees to return")
):
    """
    Get all employees with pagination
    
    - **skip**: Number of employees to skip (for pagination)
    - **limit**: Maximum number of employees to return (1-100)
    """
    try:
        return await EmployeeService.get_all_employees(skip=skip, limit=limit)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve employees: {str(e)}"
        )

@router.get("/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    """
    Get dashboard statistics
    
    Returns:
    - Total number of employees
    - Number of employees added in the last 3 months
    - Department-wise employee distribution
    - Monthly employee addition trends
    """
    try:
        return await EmployeeService.get_dashboard_stats()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve dashboard stats: {str(e)}"
        )

@router.get("/{employee_id}", response_model=EmployeeResponse)
async def get_employee(employee_id: str):
    """
    Get a specific employee by employee_id
    
    - **employee_id**: The unique employee identifier (e.g., EMP001)
    """
    try:
        employee = await EmployeeService.get_employee_by_id(employee_id)
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found"
            )
        return employee
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve employee: {str(e)}"
        )

@router.put("/{employee_id}", response_model=EmployeeResponse)
async def update_employee(employee_id: str, employee_update: EmployeeUpdate):
    """
    Update an existing employee
    
    - **employee_id**: The unique employee identifier (e.g., EMP001)
    - **name**: Updated employee name (optional)
    - **age**: Updated employee age (optional)
    - **department**: Updated employee department (optional)
    """
    try:
        updated_employee = await EmployeeService.update_employee(employee_id, employee_update)
        if not updated_employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found"
            )
        return updated_employee
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update employee: {str(e)}"
        )

@router.delete("/{employee_id}")
async def delete_employee(employee_id: str):
    """
    Delete an employee
    
    - **employee_id**: The unique employee identifier (e.g., EMP001)
    """
    try:
        deleted = await EmployeeService.delete_employee(employee_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Employee with ID {employee_id} not found"
            )
        
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={"message": f"Employee {employee_id} deleted successfully"}
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete employee: {str(e)}"
        )
