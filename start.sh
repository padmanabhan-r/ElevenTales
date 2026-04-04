#!/bin/bash
set -e

echo "[start] Building frontend..."
cd frontend
npm install
npm run build
mkdir -p ../backend/frontend
cp -r dist ../backend/frontend/
cd ..

echo "[start] Starting backend..."
cd backend
uv sync
uvicorn main:app --host 0.0.0.0 --port "${PORT:-8080}"
