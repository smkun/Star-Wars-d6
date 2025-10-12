#!/usr/bin/env node
const { spawn } = require('child_process');

// Start MySQL API
const api = spawn('npm', ['run', 'dev:mysql-api'], {
  stdio: 'inherit',
  shell: true
});

// Start Vite
const web = spawn('npm', ['run', 'dev:web'], {
  stdio: 'inherit',
  shell: true
});

// Kill both on exit
process.on('SIGINT', () => {
  api.kill();
  web.kill();
  process.exit();
});
