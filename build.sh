#!/bin/bash

set -e

echo "🚀 Building Protego History Sidepanel Extension..."

echo ""
echo "📦 Step 1: Building backend with Docker..."
docker-compose up -d --build

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

echo ""
echo "✅ Checking backend health..."
for i in {1..30}; do
  if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
    break
  fi
  if [ $i -eq 30 ]; then
    echo "❌ Backend failed to start. Check docker logs."
    exit 1
  fi
  echo "Waiting for backend... ($i/30)"
  sleep 2
done

echo ""
echo "🔧 Step 2: Installing extension dependencies..."
cd extension
npm install

echo ""
echo "🏗️  Step 3: Building extension (TypeScript + React + SCSS)..."
npm run build

echo ""
echo "✅ Build complete!"
echo ""
echo "📋 Next steps:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode' (toggle in top-right)"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'extension/dist' directory"
echo "5. Click the extension icon in the toolbar to open the side panel"
echo ""
echo "🌐 Backend API running at: http://localhost:8000"
echo "📊 API docs available at: http://localhost:8000/docs"
echo ""
echo "To stop services: docker-compose down"

