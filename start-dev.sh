#!/bin/bash
# Start both dev servers

trap 'kill 0' EXIT

npm run dev:mysql-api &
npm run dev:web &

wait
