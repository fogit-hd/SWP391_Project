#!/bin/bash

# Setup script for SWP391 EV Co-ownership Project

echo "=========================================="
echo "SWP391 EV Co-ownership System Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 14+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Backend dependencies installed successfully"
    else
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
else
    echo "✅ Backend dependencies already installed"
fi
cd ..
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
    if [ $? -eq 0 ]; then
        echo "✅ Frontend dependencies installed successfully"
    else
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
else
    echo "✅ Frontend dependencies already installed"
fi
cd ..
echo ""

echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "To run the application:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd backend && npm start"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd frontend && npm start"
echo ""
echo "The application will be available at:"
echo "  Frontend: http://localhost:3000"
echo "  Backend:  http://localhost:5000"
echo ""
