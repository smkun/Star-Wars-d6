#!/bin/bash
# Simple dev launcher - runs MySQL API and Vite in parallel

# Trap Ctrl+C to kill both processes
trap 'kill 0' EXIT

# Start MySQL API in background
npm run dev:mysql-api &

# Start Vite dev server in background
npm run dev:web &

# Wait for both processes
wait
