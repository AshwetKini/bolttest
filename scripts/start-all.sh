#!/bin/bash

# Shopee Monorepo - Start All Services
echo "🚀 Starting Shopee services..."

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Port $1 is already in use"
        return 1
    else
        return 0
    fi
}

# Check required ports
echo "🔍 Checking ports..."
check_port 3000 || exit 1
check_port 5173 || exit 1

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start admin dashboard
echo "🖥️  Starting admin dashboard..."
cd admin
npm run dev &
ADMIN_PID=$!
cd ..

# Start mobile app (optional - user can start manually)
echo "📱 Mobile app can be started with: npm run dev:mobile"

echo "✅ Services started successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Backend API: http://localhost:3000"
echo "   API Docs: http://localhost:3000/api/docs"
echo "   Admin Dashboard: http://localhost:5173"
echo ""
echo "🛑 To stop all services, press Ctrl+C"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $ADMIN_PID 2>/dev/null
    echo "✅ All services stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait