#!/usr/bin/env node
/**
 * dev.js - Cross-platform Node.js development launcher
 *
 * Starts both MySQL API and Vite dev server with process management
 * Works on Windows, macOS, and Linux
 */

const { spawn } = require('child_process');
const { existsSync, readFileSync } = require('fs');
const { join } = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  error: (msg) => console.error(`${colors.red}✗ ${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  banner: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`),
};

// Process references
const processes = {
  api: null,
  web: null,
};

// Load environment variables from .env file
function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const match = line.match(/^([^#][^=]+)=(.*)$/);
      if (match) {
        const [, key, value] = match;
        process.env[key.trim()] = value.trim();
      }
    });
    log.success('.env file loaded');
    return true;
  }
  log.warn('.env file not found (using environment variables)');
  return false;
}

// Check environment prerequisites
function checkEnvironment() {
  log.banner('\n╔═══════════════════════════════════════╗');
  log.banner('║  Star Wars d6 Development Launcher   ║');
  log.banner('╚═══════════════════════════════════════╝\n');

  log.info('Checking environment...');

  // Check Node version
  const nodeVersion = process.version.match(/^v(\d+)/)[1];
  if (parseInt(nodeVersion) < 20) {
    log.error(`Node.js 20.0.0+ required (found: ${process.version})`);
    return false;
  }
  log.success(`Node.js ${process.version}`);

  // Load .env
  loadEnv();

  // Check MYSQL_URL
  if (!process.env.MYSQL_URL) {
    log.error('MYSQL_URL not set');
    log.info('Create .env file with:');
    log.info('  MYSQL_URL=mysql://user:pass@host:3306/gamers_d6Holochron');
    return false;
  }
  log.success('MYSQL_URL configured');

  // Check mysql2 dependency
  try {
    require.resolve('mysql2');
    log.success('mysql2 installed');
  } catch (e) {
    log.warn('mysql2 not installed');
    log.info('Installing dependencies...');
    // Dependencies will be installed by npm
  }

  log.success('Environment check passed\n');
  return true;
}

// Start a process with output handling
function startProcess(name, command, args, cwd, color) {
  return new Promise((resolve, reject) => {
    log.info(`Starting ${name}...`);

    const proc = spawn(command, args, {
      cwd: cwd || process.cwd(),
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env },
    });

    processes[name.toLowerCase()] = proc;

    let output = '';
    let ready = false;

    proc.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;

      // Log with color prefix
      text.split('\n').forEach((line) => {
        if (line.trim()) {
          console.log(`${color}[${name}]${colors.reset} ${line}`);
        }
      });

      // Check if process is ready
      if (name === 'API' && text.includes('listening on')) {
        if (!ready) {
          ready = true;
          log.success(`${name} ready at http://localhost:4000`);
          log.info('  GET /species - List all species');
          log.info('  GET /species/:slug - Get species by slug');
          resolve();
        }
      } else if (name === 'Web' && text.includes('Local:')) {
        if (!ready) {
          ready = true;
          log.success(`${name} ready at http://localhost:5173`);
          log.info('  Home:    http://localhost:5173/');
          log.info('  Species: http://localhost:5173/species');
          log.info('  Ships:   http://localhost:5173/starships');
          resolve();
        }
      }
    });

    proc.stderr.on('data', (data) => {
      const text = data.toString();
      text.split('\n').forEach((line) => {
        if (line.trim()) {
          console.log(`${colors.yellow}[${name}]${colors.reset} ${line}`);
        }
      });
    });

    proc.on('error', (error) => {
      log.error(`${name} failed to start: ${error.message}`);
      reject(error);
    });

    proc.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        log.error(`${name} exited with code ${code}`);
      }
    });

    // Timeout fallback in case ready signal not detected
    setTimeout(() => {
      if (!ready) {
        log.warn(`${name} ready signal not detected (assuming ready)`);
        resolve();
      }
    }, name === 'API' ? 5000 : 10000);
  });
}

// Cleanup function
function cleanup() {
  log.warn('\nShutting down development servers...');

  if (processes.api) {
    log.info('Stopping MySQL API');
    processes.api.kill();
  }

  if (processes.web) {
    log.info('Stopping Vite dev server');
    processes.web.kill();
  }

  log.success('Shutdown complete');
  process.exit(0);
}

// Main execution
async function main() {
  // Set up cleanup handlers
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  // Check environment
  if (!checkEnvironment()) {
    process.exit(1);
  }

  try {
    // Start MySQL API
    await startProcess(
      'API',
      'node',
      ['./api/run-local-server.js'],
      process.cwd(),
      colors.cyan
    );

    // Wait a bit before starting web server
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Start Vite dev server
    await startProcess(
      'Web',
      'npm',
      ['run', 'dev:web'],
      process.cwd(),
      colors.blue
    );

    // Success message
    console.log(`\n${colors.green}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.green}Development servers running!${colors.reset}`);
    console.log(`${colors.green}═══════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.blue}MySQL API:${colors.reset}    http://localhost:4000 (PID: ${processes.api.pid})`);
    console.log(`${colors.blue}Vite Server:${colors.reset}  http://localhost:5173 (PID: ${processes.web.pid})`);

    console.log(`\n${colors.yellow}Press Ctrl+C to stop all servers${colors.reset}\n`);

    // Keep process alive
    await new Promise(() => {});
  } catch (error) {
    log.error(`Failed to start servers: ${error.message}`);
    cleanup();
    process.exit(1);
  }
}

// Show help
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
${colors.cyan}Star Wars d6 Development Launcher${colors.reset}

Usage: npm run dev:all [OPTIONS]

OPTIONS:
  -h, --help              Show this help message

ENVIRONMENT:
  MYSQL_URL               MySQL connection string (required)
                          Format: mysql://user:pass@host:3306/database
                          Can be set in .env file at project root

EXAMPLES:
  npm run dev:all                    # Start both servers
  npm run dev:mysql-api              # API server only
  npm run dev:web                    # Vite server only

PORTS:
  MySQL API:    http://localhost:4000
  Vite Server:  http://localhost:5173

Press Ctrl+C to stop all servers.
  `);
  process.exit(0);
}

// Run main
main().catch((error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});
