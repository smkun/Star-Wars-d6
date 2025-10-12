#!/usr/bin/env bash
#
# dev.sh - Development launcher for Star Wars d6 Catalog
#
# Starts both MySQL API and Vite dev server with proper process management
# Usage: ./scripts/dev.sh [--help]
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Process IDs
API_PID=""
WEB_PID=""

# Cleanup function
cleanup() {
  echo -e "\n${YELLOW}Shutting down development servers...${NC}"

  if [ -n "$API_PID" ]; then
    echo -e "${BLUE}Stopping MySQL API (PID: $API_PID)${NC}"
    kill $API_PID 2>/dev/null || true
  fi

  if [ -n "$WEB_PID" ]; then
    echo -e "${BLUE}Stopping Vite dev server (PID: $WEB_PID)${NC}"
    kill $WEB_PID 2>/dev/null || true
  fi

  # Kill any remaining processes on the ports
  echo -e "${BLUE}Cleaning up ports 4000 and 5173${NC}"
  lsof -ti:4000 2>/dev/null | xargs kill -9 2>/dev/null || true
  lsof -ti:5173 2>/dev/null | xargs kill -9 2>/dev/null || true

  echo -e "${GREEN}Shutdown complete${NC}"
  exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Help message
show_help() {
  cat << EOF
${GREEN}Star Wars d6 Development Launcher${NC}

Usage: ./scripts/dev.sh [OPTIONS]

OPTIONS:
  -h, --help              Show this help message
  --check                 Check environment and exit (no server start)
  --api-only              Start only MySQL API server
  --web-only              Start only Vite dev server
  --no-cleanup            Skip port cleanup before starting

ENVIRONMENT:
  MYSQL_URL               MySQL connection string (required)
                          Format: mysql://user:pass@host:3306/database
                          Can be set in .env file at project root

EXAMPLES:
  ./scripts/dev.sh                    # Start both servers
  ./scripts/dev.sh --check            # Validate environment
  ./scripts/dev.sh --api-only         # API server only

PORTS:
  MySQL API:    http://localhost:4000
  Vite Server:  http://localhost:5173

Press Ctrl+C to stop all servers.

EOF
  exit 0
}

# Check environment
check_environment() {
  echo -e "${BLUE}Checking environment...${NC}"

  # Check Node.js version
  if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js not found${NC}"
    echo -e "Install Node.js 20.0.0 or higher"
    return 1
  fi

  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js version 20.0.0+ required (found: $(node --version))${NC}"
    return 1
  fi
  echo -e "${GREEN}✓ Node.js $(node --version)${NC}"

  # Check npm
  if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm not found${NC}"
    return 1
  fi
  echo -e "${GREEN}✓ npm $(npm --version)${NC}"

  # Check for .env file
  if [ -f ".env" ]; then
    echo -e "${GREEN}✓ .env file found${NC}"
    # Source .env file
    export $(cat .env | grep -v '^#' | xargs)
  else
    echo -e "${YELLOW}⚠ .env file not found (using environment variables)${NC}"
  fi

  # Check MYSQL_URL
  if [ -z "$MYSQL_URL" ]; then
    echo -e "${RED}Error: MYSQL_URL not set${NC}"
    echo -e "Create .env file with:"
    echo -e "  MYSQL_URL=mysql://user:pass@host:3306/gamers_d6Holochron"
    return 1
  fi
  echo -e "${GREEN}✓ MYSQL_URL configured${NC}"

  # Check if mysql2 is installed
  if ! npm list mysql2 --depth=0 &> /dev/null; then
    echo -e "${YELLOW}⚠ mysql2 not installed${NC}"
    echo -e "${BLUE}Installing dependencies...${NC}"
    npm install
  else
    echo -e "${GREEN}✓ mysql2 installed${NC}"
  fi

  # Check for port conflicts
  if lsof -Pi :4000 -sTCP:LISTEN -t &> /dev/null; then
    echo -e "${YELLOW}⚠ Port 4000 in use${NC}"
    if [ "$NO_CLEANUP" != "true" ]; then
      echo -e "${BLUE}Killing process on port 4000...${NC}"
      lsof -ti:4000 | xargs kill -9 2>/dev/null || true
      sleep 1
    fi
  fi

  if lsof -Pi :5173 -sTCP:LISTEN -t &> /dev/null; then
    echo -e "${YELLOW}⚠ Port 5173 in use${NC}"
    if [ "$NO_CLEANUP" != "true" ]; then
      echo -e "${BLUE}Killing process on port 5173...${NC}"
      lsof -ti:5173 | xargs kill -9 2>/dev/null || true
      sleep 1
    fi
  fi

  echo -e "${GREEN}Environment check passed${NC}\n"
  return 0
}

# Start MySQL API server
start_api() {
  echo -e "${BLUE}Starting MySQL API server on port 4000...${NC}"

  # Start API server in background
  node ./api/run-local-server.js > api.log 2>&1 &
  API_PID=$!

  # Wait for API to be ready
  echo -e "${YELLOW}Waiting for API to be ready...${NC}"
  for i in {1..10}; do
    if curl -s http://localhost:4000/species > /dev/null 2>&1; then
      echo -e "${GREEN}✓ MySQL API ready at http://localhost:4000${NC}"
      echo -e "${BLUE}  GET /species - List all species${NC}"
      echo -e "${BLUE}  GET /species/:slug - Get species by slug${NC}"
      return 0
    fi
    sleep 1
  done

  echo -e "${RED}Error: API failed to start${NC}"
  echo -e "${YELLOW}Check api.log for details${NC}"
  tail -20 api.log
  return 1
}

# Start Vite dev server
start_web() {
  echo -e "\n${BLUE}Starting Vite dev server on port 5173...${NC}"

  # Start Vite in background
  npm run dev:web > web.log 2>&1 &
  WEB_PID=$!

  # Wait for Vite to be ready
  echo -e "${YELLOW}Waiting for Vite to be ready...${NC}"
  for i in {1..15}; do
    if curl -s http://localhost:5173 > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Vite dev server ready at http://localhost:5173${NC}"
      echo -e "${BLUE}  Home:    http://localhost:5173/${NC}"
      echo -e "${BLUE}  Species: http://localhost:5173/species${NC}"
      echo -e "${BLUE}  Ships:   http://localhost:5173/starships${NC}"
      return 0
    fi
    sleep 1
  done

  echo -e "${RED}Error: Vite failed to start${NC}"
  echo -e "${YELLOW}Check web.log for details${NC}"
  tail -20 web.log
  return 1
}

# Main execution
main() {
  # Parse arguments
  API_ONLY=false
  WEB_ONLY=false
  CHECK_ONLY=false
  NO_CLEANUP=false

  for arg in "$@"; do
    case $arg in
      -h|--help)
        show_help
        ;;
      --check)
        CHECK_ONLY=true
        ;;
      --api-only)
        API_ONLY=true
        ;;
      --web-only)
        WEB_ONLY=true
        ;;
      --no-cleanup)
        NO_CLEANUP=true
        ;;
      *)
        echo -e "${RED}Unknown option: $arg${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
    esac
  done

  # Show banner
  echo -e "${GREEN}"
  echo "╔═══════════════════════════════════════╗"
  echo "║  Star Wars d6 Development Launcher   ║"
  echo "╚═══════════════════════════════════════╝"
  echo -e "${NC}"

  # Check environment
  if ! check_environment; then
    exit 1
  fi

  if [ "$CHECK_ONLY" = true ]; then
    echo -e "${GREEN}Environment check complete${NC}"
    exit 0
  fi

  # Create log directory if needed
  mkdir -p logs

  # Start servers based on flags
  if [ "$WEB_ONLY" = false ]; then
    if ! start_api; then
      exit 1
    fi
  fi

  if [ "$API_ONLY" = false ]; then
    if ! start_web; then
      cleanup
      exit 1
    fi
  fi

  # Success message
  echo -e "\n${GREEN}═══════════════════════════════════════${NC}"
  echo -e "${GREEN}Development servers running!${NC}"
  echo -e "${GREEN}═══════════════════════════════════════${NC}\n"

  if [ "$WEB_ONLY" = false ]; then
    echo -e "${BLUE}MySQL API:${NC}    http://localhost:4000 (PID: $API_PID)"
  fi

  if [ "$API_ONLY" = false ]; then
    echo -e "${BLUE}Vite Server:${NC}  http://localhost:5173 (PID: $WEB_PID)"
  fi

  echo -e "\n${YELLOW}Logs:${NC}"
  if [ "$WEB_ONLY" = false ]; then
    echo -e "  API: tail -f api.log"
  fi
  if [ "$API_ONLY" = false ]; then
    echo -e "  Web: tail -f web.log"
  fi

  echo -e "\n${YELLOW}Press Ctrl+C to stop all servers${NC}\n"

  # Wait for user interrupt
  wait
}

# Run main function
main "$@"
