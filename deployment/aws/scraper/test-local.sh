#!/bin/bash

# Test script for local Docker build
set -e

echo "🧪 Testing Aligno Scraper locally with Docker..."

# Build Docker image
echo "🔨 Building Docker image..."
docker build -t scraper-test -f Dockerfile ../../..

echo "✅ Docker image built successfully"

# Test the image (this will fail without proper environment variables, but we can check if it starts)
echo "🚀 Testing container startup..."
docker run --rm scraper-test python --version

echo "✅ Container test completed successfully"
echo "📝 To run with real data, set up environment variables:"
echo "   docker run --rm -e AWS_DB_ENDPOINT=your-endpoint -e AWS_DB_USERNAME=your-username -e AWS_DB_PASSWORD=your-password -e AWS_DB_NAME=your-db scraper-test"
