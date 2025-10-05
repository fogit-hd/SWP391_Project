#!/bin/bash

# Run script for SWP391 EV Co-ownership Project
# This script runs both backend and frontend simultaneously

echo "=========================================="
echo "Starting SWP391 EV Co-ownership System"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Start Backend
echo "🚀 Starting Backend on port 5000..."
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start Frontend
echo "🚀 Starting Frontend on port 3000..."
cd frontend
BROWSER=none npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "=========================================="
echo "✅ Both servers are starting..."
echo "=========================================="
echo ""
echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
