#!/bin/bash

# VEX MCP Server Development Workflow Script
# Usage: ./dev.sh [command]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}🔧 VEX MCP Server Development Tools${NC}"
    echo "================================================"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

check_token() {
    if [[ -z "$ROBOTEVENTS_TOKEN" ]]; then
        print_warning "ROBOTEVENTS_TOKEN not set"
        echo "Some tests may fail. Set it with:"
        echo "export ROBOTEVENTS_TOKEN=your_token_here"
        echo ""
    else
        print_success "ROBOTEVENTS_TOKEN is set"
    fi
}

build() {
    echo "🔨 Building project..."
    npm run build
    print_success "Build completed"
}

test_quick() {
    echo "⚡ Running quick test suite..."
    build
    check_token
    ROBOTEVENTS_TOKEN="${ROBOTEVENTS_TOKEN:-test-token}" npm run test
}

test_interactive() {
    echo "🎮 Starting interactive test mode..."
    build
    check_token
    ROBOTEVENTS_TOKEN="${ROBOTEVENTS_TOKEN:-test-token}" npm run test-interactive
}

test_api() {
    echo "🌐 Testing RobotEvents API directly..."
    check_token
    if [[ -z "$ROBOTEVENTS_TOKEN" ]]; then
        print_error "ROBOTEVENTS_TOKEN is required for API testing"
        exit 1
    fi
    npm run test-api
}

dev_watch() {
    echo "👀 Starting development watch mode..."
    echo "File changes will trigger automatic rebuild and test"
    
    check_token
    
    # Initial build and test
    test_quick
    
    echo ""
    echo "Watching for changes... (Press Ctrl+C to stop)"
    
    # Simple file watching (works on macOS and Linux)
    while true; do
        # Check if any TypeScript files changed
        if find src -name "*.ts" -newer build/index.js 2>/dev/null | grep -q .; then
            echo ""
            echo "📝 Changes detected, rebuilding..."
            test_quick
            echo "⏳ Watching for more changes..."
        fi
        sleep 2
    done
}

clean() {
    echo "🧹 Cleaning build artifacts..."
    rm -rf build/
    rm -f *.log
    print_success "Clean completed"
}

install() {
    echo "📦 Installing dependencies..."
    npm install
    print_success "Dependencies installed"
}

setup() {
    echo "🚀 Setting up development environment..."
    install
    build
    
    echo ""
    echo "Setup complete! Available commands:"
    echo "  ./dev.sh test      - Run quick test suite"  
    echo "  ./dev.sh test-i    - Interactive testing"
    echo "  ./dev.sh test-api  - Test RobotEvents API"
    echo "  ./dev.sh watch     - Watch for changes"
    echo "  ./dev.sh build     - Build project"
    echo "  ./dev.sh clean     - Clean build files"
    echo ""
    print_warning "Don't forget to set ROBOTEVENTS_TOKEN!"
}

show_help() {
    print_header
    echo ""
    echo "Available commands:"
    echo "  setup         - Initial setup (install deps, build)"
    echo "  build         - Build the project"
    echo "  test          - Run quick test suite"
    echo "  test-i        - Interactive testing mode" 
    echo "  test-api      - Test RobotEvents API directly"
    echo "  watch         - Watch files and auto-test"
    echo "  clean         - Clean build artifacts"
    echo "  help          - Show this help"
    echo ""
    echo "Environment variables:"
    echo "  ROBOTEVENTS_TOKEN - Your RobotEvents API token"
    echo ""
    echo "Examples:"
    echo "  ./dev.sh setup"
    echo "  ROBOTEVENTS_TOKEN=abc123 ./dev.sh test"
    echo "  ./dev.sh watch"
}

# Main command dispatch
case "${1:-help}" in
    "setup")
        print_header
        setup
        ;;
    "build")
        print_header
        build
        ;;
    "test")
        print_header
        test_quick
        ;;
    "test-i"|"test-interactive")
        print_header
        test_interactive
        ;;
    "test-api")
        print_header
        test_api
        ;;
    "watch")
        print_header
        dev_watch
        ;;
    "clean")
        print_header
        clean
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac