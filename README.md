# VEX MCP Server

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![VEX Robotics](https://img.shields.io/badge/VEX-Robotics-orange)](https://www.vexrobotics.com/)

A Model Context Protocol (MCP) server for VEX Robotics Competition data using the RobotEvents API. This server enables Claude Desktop (and other MCP clients) to access comprehensive VEX competition data including teams, events, rankings, and skills scores.

## Features

- **search-teams**: Search for VEX teams by number, name, organization, or location
- **get-team-info**: Get detailed information about a specific team
- **search-events**: Search for VEX events by name, location, date, or program
- **get-event-details**: Get detailed information about a specific event
- **get-team-rankings**: Get team rankings and performance at events  
- **get-skills-scores**: Get robot skills scores for teams

## Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- A RobotEvents API token (free registration required)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jackyang/vex-mcp-server.git
   cd vex-mcp-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Get a RobotEvents API token:**
   - Visit https://www.robotevents.com/api/v2
   - Click "Request API Access" and fill out the form
   - Once approved, copy your JWT token

4. **Configure your token:**
   
   **Option A: Environment Variable (Recommended)**
   ```bash
   export ROBOTEVENTS_TOKEN="your-jwt-token-here"
   ```
   
   **Option B: .env File**
   ```bash
   echo "ROBOTEVENTS_TOKEN=your-jwt-token-here" > .env
   ```

5. **Build and test:**
   ```bash
   npm run build
   npm run test
   ```

## Usage with Claude Desktop

### Configuration

Add this server to your Claude Desktop configuration file:

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Configuration:**
```json
{
  "mcpServers": {
    "vex-robotics": {
      "command": "node",
      "args": ["/absolute/path/to/vex-mcp-server/build/index.js"],
      "env": {
        "ROBOTEVENTS_TOKEN": "your-actual-jwt-token-here"
      }
    }
  }
}
```

**⚠️ Important Notes:**
- Use the **absolute path** to your `build/index.js` file
- Replace `your-actual-jwt-token-here` with your real RobotEvents API token
- Restart Claude Desktop after making configuration changes

### Using the Server

Once configured, you can ask Claude questions like:
- *"Find VEX teams in California"*
- *"Search for robotics events in Texas this season"*
- *"Get rankings for team 12345 at their last event"*
- *"Show me the skills scores for teams at the World Championship"*

## Supported Programs

- **VRC**: VEX Robotics Competition (High School)
- **VIQC**: VEX IQ Challenge (Elementary/Middle School)
- **VEXU**: VEX U (College)

## API Tools Reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `search-teams` | Find teams by number, name, or location | `number`, `name`, `organization`, `location`, `program` |
| `get-team-info` | Get detailed team information | `team_id` (required) |
| `search-events` | Find events by name, location, or date | `name`, `location`, `start`, `end`, `program`, `season` |
| `get-event-details` | Get detailed event information | `event_id` (required) |
| `get-team-rankings` | Get team rankings at events | `team_id`, `event_id`, `season` |
| `get-skills-scores` | Get robot skills scores | `team_id`, `event_id`, `season` |

## Troubleshooting

### Common Issues

**"Error: Cannot find module" or "Command failed"**
- Ensure you've run `npm run build` after installation
- Check that the path in Claude Desktop config points to the correct `build/index.js` file

**"Authentication failed" or "Invalid token"**
- Verify your RobotEvents API token is correct and active
- Make sure the token is properly set in environment variables or .env file
- Check that your API access has been approved by RobotEvents

**"No events found" or "Search failed"**
- The server uses a hybrid search approach (web search + API)
- Some searches may take a few seconds to complete
- Try different search terms or be more specific

**Claude Desktop not recognizing the server**
- Restart Claude Desktop after configuration changes
- Check the JSON syntax in your configuration file
- Ensure the file path uses forward slashes, even on Windows

### Debug Mode

To see detailed debug logs:
```bash
node build/index.js 2>&1 | grep DEBUG
```

### Support

- **Issues**: Report bugs at [GitHub Issues](https://github.com/jackyang/vex-mcp-server/issues)
- **VEX Community**: Discuss at [VEX Forum](https://www.vexforum.com/)
- **RobotEvents API**: Documentation at https://www.robotevents.com/api/v2

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.