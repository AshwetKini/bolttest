#!/bin/bash

# Shopee Monorepo - Database Seeding Script
echo "🌱 Running database seed..."

# Check if backend directory exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found. Please run from project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f "backend/.env" ]; then
    echo "❌ Backend .env file not found. Please copy from .env.example and configure."
    exit 1
fi

# Run the seed script
cd backend
echo "📦 Installing dependencies..."
npm install

echo "🌱 Seeding database..."
npm run seed

if [ $? -eq 0 ]; then
    echo "✅ Database seeded successfully!"
    echo ""
    echo "🔑 Test credentials:"
    echo "   Admin: +1234567890 / 1234"
    echo "   Store Owner: +1987654321 / 1234"
else
    echo "❌ Database seeding failed!"
    exit 1
fi