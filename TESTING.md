# VEX MCP Server Testing & Development Guide

This document explains how to test and debug the VEX MCP Server efficiently.

## 🚀 Quick Start

```bash
# Setup everything (first time)
./dev.sh setup

# Set your RobotEvents API token
export ROBOTEVENTS_TOKEN=your_token_here

# Run tests
./dev.sh test
```

## 🧪 Testing Tools

### 1. **MCP Client Test Script** (`test_mcp_client.mjs`)
A complete MCP client that can communicate directly with our server without Claude Desktop.

**Features:**
- ✅ Direct MCP protocol communication
- ✅ Comprehensive test suite for all tools
- ✅ Interactive testing mode
- ✅ Real-time server logs and debugging
- ✅ Performance monitoring
- ✅ Error reporting and analysis

### 2. **API Test Script** (`test_api.mjs`)
Tests the RobotEvents API directly to validate parameter formats.

**Features:**
- ✅ Tests different parameter combinations
- ✅ Validates API authentication
- ✅ Discovers correct parameter formats
- ✅ Shows API response structures

### 3. **Development Workflow Script** (`dev.sh`)
Automates common development tasks.

## 📋 Available Commands

### Development Commands
```bash
./dev.sh setup         # Initial setup
./dev.sh build         # Build project  
./dev.sh clean         # Clean build files
./dev.sh watch         # Auto-rebuild on changes
```

### Testing Commands
```bash
./dev.sh test          # Quick test suite
./dev.sh test-i        # Interactive testing
./dev.sh test-api      # Test RobotEvents API

# Or use npm directly:
npm test               # Quick test suite
npm run test-interactive
npm run test-api
```

### Manual Testing
```bash
# Start server manually
ROBOTEVENTS_TOKEN=your_token node build/index.js

# Test with MCP client
node test_mcp_client.mjs --suite
node test_mcp_client.mjs --interactive
```

## 🔍 Debugging

### Server Logs
The test client shows real-time server output including:
- `[DEBUG]` messages - Parameter values and API responses
- `[ERROR]` messages - Detailed error information
- API call timing and performance data

### Interactive Mode
```bash
./dev.sh test-i
```

In interactive mode, you can:
- `list` - Show all available tools
- `test search-events {}` - Test with specific parameters
- `test search-events {"name": "State"}` - Test with JSON args
- `suite` - Run full test suite
- `quit` - Exit

### Common Debug Scenarios

**1. Tool fails with "Cannot read properties of undefined"**
```bash
# Check raw arguments being passed
./dev.sh test-i
> test search-events {}
```

**2. API authentication issues**
```bash
# Test API directly
./dev.sh test-api
```

**3. Parameter format problems**
```bash
# Test different parameter combinations
./dev.sh test-i
> test search-events {"program": "VRC"}
> test search-events {"program": 1}
```

## 🎯 Test Coverage

The automated test suite covers:

### search-events tool
- ✅ No parameters (basic search)
- ✅ Name parameter
- ✅ Program parameter (string and numeric)
- ✅ Location parameter
- ✅ Combined parameters
- ✅ Error handling

### search-teams tool
- ✅ No parameters
- ✅ Team number search
- ✅ Organization search
- ✅ Error handling

### get-team-info tool
- ✅ By team ID
- ✅ By team number
- ✅ Error handling (invalid team)

### Other tools
- ✅ get-event-details
- ✅ get-team-rankings  
- ✅ get-skills-scores

## 🐛 Troubleshooting

### "Cannot find module @modelcontextprotocol/sdk"
```bash
npm install
```

### "Server failed to start"
```bash
# Check if build directory exists
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### "Authentication failed"
```bash
# Verify token is set
echo $ROBOTEVENTS_TOKEN

# Test API directly
./dev.sh test-api
```

### Tests timeout
```bash
# Increase timeout in test_mcp_client.mjs
# Or check network connectivity
```

## 🔄 Development Workflow

### Making Changes
1. Edit source files in `src/`
2. Run `./dev.sh watch` for auto-testing
3. Or manually: `./dev.sh build && ./dev.sh test`

### Before Committing
```bash
# Run full test suite
./dev.sh test

# Check for TypeScript errors
npx tsc --noEmit

# Test with real API token
ROBOTEVENTS_TOKEN=real_token ./dev.sh test
```

### Testing with Claude Desktop
1. Build: `npm run build`  
2. Update Claude Desktop config to point to `build/index.js`
3. Restart Claude Desktop
4. Test tools in conversation

## 📊 Performance Monitoring

The test client tracks:
- Response times for each tool call
- API call success/failure rates  
- Server startup time
- Memory usage patterns

## 🚀 Advanced Usage

### Custom Test Cases
Edit `test_mcp_client.mjs` to add specific test scenarios:

```javascript
// Add to runTestSuite()
const customTest = await this.testTool('search-events', {
    program: 'VRC',
    location: 'California',
    name: 'Championship'
});
```

### Environment Configuration
```bash
# Different environments
export NODE_ENV=development
export ROBOTEVENTS_TOKEN=dev_token

# Debug mode
export DEBUG=1
export VERBOSE_LOGGING=1
```

This testing system allows for rapid iteration and confident development without relying on external tools like Claude Desktop for verification.