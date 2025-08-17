#!/bin/bash

# Employee Management System - MCP Server Setup Script
# This script sets up MongoDB MCP server and Browser MCP server

echo "🚀 Setting up MCP Servers for Employee Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are available"

# Install MongoDB MCP Server
echo "📦 Installing MongoDB MCP Server..."
npm install -g @modelcontextprotocol/server-mongodb

# Install Browser MCP Server
echo "📦 Installing Browser MCP Server..."
npm install -g @modelcontextprotocol/server-browser

# Create .env file for backend if it doesn't exist
if [ ! -f "backend/.env" ]; then
    echo "📝 Creating backend .env file..."
    cp backend/.env.example backend/.env
    echo "✅ Created backend/.env file. Please update MongoDB URI if needed."
else
    echo "✅ Backend .env file already exists"
fi

# Display MongoDB connection options
echo ""
echo "🔧 MongoDB Setup Options:"
echo "1. Local MongoDB: mongodb://localhost:27017/employee_management"
echo "2. MongoDB Atlas: mongodb+srv://username:password@cluster.mongodb.net/employee_management"
echo ""
echo "📋 MCP Configuration created in mcp-config.json"
echo ""
echo "🎯 Next Steps:"
echo "1. Start MongoDB (if using local instance)"
echo "2. Update backend/.env with your MongoDB URI"
echo "3. Install Python dependencies: cd backend && pip install -r requirements.txt"
echo "4. Start the backend: cd backend && uvicorn main:app --reload"
echo ""
echo "✨ MCP Servers are ready to use!"
