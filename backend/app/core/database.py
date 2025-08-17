from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ConnectionFailure
import logging
from app.core.config import settings

# Global variables for database connection
client: AsyncIOMotorClient = None
database: AsyncIOMotorDatabase = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def connect_to_mongo():
    """Create database connection"""
    global client, database
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(
            settings.MONGODB_URI,
            maxPoolSize=10,
            minPoolSize=1,
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=10000,
            socketTimeoutMS=10000
        )
        
        # Test the connection
        await client.admin.command('ping')
        
        # Get database
        database = client[settings.MONGODB_DATABASE]
        
        # Create indexes
        await create_indexes()
        
        logger.info(f"Connected to MongoDB: {settings.MONGODB_DATABASE}")
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    global client
    
    if client:
        client.close()
        logger.info("Disconnected from MongoDB")

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return database

async def create_indexes():
    """Create database indexes"""
    try:
        # Create unique index on employee_id
        await database.employees.create_index(
            "employee_id", 
            unique=True, 
            name="idx_employee_id_unique"
        )
        
        # Create index on department
        await database.employees.create_index(
            "department", 
            name="idx_department"
        )
        
        # Create index on created_at (descending)
        await database.employees.create_index(
            [("created_at", -1)], 
            name="idx_created_at_desc"
        )
        
        # Create compound index for dashboard queries
        await database.employees.create_index(
            [("created_at", -1), ("department", 1)], 
            name="idx_created_dept_compound"
        )
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Error creating indexes: {e}")
        # Don't raise here as indexes might already exist
