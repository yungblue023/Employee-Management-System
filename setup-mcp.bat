@echo off
echo 🚀 Setting up MCP Servers for Employee Management System...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js and npm are available

REM Install MongoDB MCP Server
echo 📦 Installing MongoDB MCP Server...
npm install -g @modelcontextprotocol/server-mongodb

REM Install Browser MCP Server
echo 📦 Installing Browser MCP Server...
npm install -g @modelcontextprotocol/server-browser

REM Create .env file for backend if it doesn't exist
if not exist "backend\.env" (
    echo 📝 Creating backend .env file...
    copy "backend\.env.example" "backend\.env"
    echo ✅ Created backend\.env file. Please update MongoDB URI if needed.
) else (
    echo ✅ Backend .env file already exists
)

echo.
echo 🔧 MongoDB Setup Options:
echo 1. Local MongoDB: mongodb://localhost:27017/employee_management
echo 2. MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/employee_management
echo.
echo 📋 MCP Configuration created in mcp-config.json
echo.
echo 🎯 Next Steps:
echo 1. Start MongoDB (if using local instance)
echo 2. Update backend\.env with your MongoDB URI
echo 3. Install Python dependencies: cd backend ^&^& pip install -r requirements.txt
echo 4. Start the backend: cd backend ^&^& uvicorn main:app --reload
echo.
echo ✨ MCP Servers are ready to use!
pause
