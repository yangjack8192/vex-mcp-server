# VEX MCP Server

[![NPM Version](https://img.shields.io/npm/v/vex-mcp-server.svg)](https://www.npmjs.com/package/vex-mcp-server)
[![NPM Downloads](https://img.shields.io/npm/dm/vex-mcp-server.svg)](https://www.npmjs.com/package/vex-mcp-server)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)
[![VEX Robotics](https://img.shields.io/badge/VEX-Robotics-orange)](https://www.vexrobotics.com/)

A Model Context Protocol (MCP) server for VEX Robotics Competition data using the RobotEvents API. This server enables Claude Desktop (and other MCP clients) to access comprehensive VEX competition data including teams, events, rankings, and skills scores.

## Features

- **search-teams**: Search for VEX teams by number, name, organization, or location
- **get-team-info**: Get detailed information about a specific team
- **get-team-awards**: Get all awards won by a specific team throughout their competitive history
- **search-events**: Search for VEX events by name, date, season, or program level
- **get-event-details**: Get detailed information about a specific event
- **get-event-awards**: Get award information for VEX events including winners and details
- **get-team-rankings**: Get team rankings and performance at events
- **get-skills-scores**: Get robot skills scores for teams
- **search-forum**: Search the VEX Forum for topics and posts
- **get-forum-topic**: Get detailed information about a forum topic with posts
- **get-forum-post**: Retrieve a single forum post by ID
- **get-forum-user**: Get user profile information from the forum
- **list-forum-categories**: List all available forum categories
- **get-latest-forum-topics**: Get the latest topics from the forum
- **analyze-match-opponents**: Analyze teammates and opponents for all matches at an event, showing their recent award history

## 🚀 Quick Start (1-Minute Setup!)

### Prerequisites
- Node.js 18.0.0 or higher
- A RobotEvents API token (free registration required)

### ⚡ Method 1: NPM Installation (Recommended)

**One-line installation:**
```bash
npm install -g vex-mcp-server
```

**Get your RobotEvents API token:**
1. Visit https://www.robotevents.com/api/v2
2. Click "Request API Access" and fill out the form  
3. Once approved, copy your JWT token

**That's it!** 🎉 You can now use `vex-mcp-server` directly in Claude Desktop.

### 🛠️ Method 2: Development Installation

For developers who want to modify the code:

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yangjack8192/vex-mcp-server.git
   cd vex-mcp-server
   ```

2. **Install and build:**
   ```bash
   npm install
   npm run build
   ```

## Usage with Claude Desktop

### 🎯 Super Simple Configuration (NPM Installation)

**Location of config file:**
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

**Configuration (NPM version):**
```json
{
  "mcpServers": {
    "vex-robotics": {
      "command": "vex-mcp-server",
      "env": {
        "ROBOTEVENTS_TOKEN": "your-actual-jwt-token-here"
      }
    }
  }
}
```

### 🛠️ Development Configuration

**Configuration (Development version):**
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

**📝 Setup Notes:**
- Replace `your-actual-jwt-token-here` with your real RobotEvents API token
- Restart Claude Desktop after making configuration changes
- NPM installation = No paths needed! 🎉

### Using the Server

Once configured, you can ask Claude questions like:
- *"Find VEX teams in California"*
- *"Search for robotics events in Texas this season"*
- *"Get rankings for team 12345 at their last event"*
- *"Show me the skills scores for teams at the World Championship"*
- *"Analyze all my matches at event 12345 to see who my opponents are"*
- *"Help me scout my upcoming matches - show me opponent awards for team 10085A at event RE-VRC-24-1234"*

## Supported Programs

- **VRC**: VEX Robotics Competition (High School)
- **VIQC**: VEX IQ Challenge (Elementary/Middle School)
- **VEXU**: VEX U (College)

## ⚠️ Breaking Changes in v2.0.0

**Important**: If you're upgrading from v1.x, please note these breaking changes:

- **Removed `region` parameter** from `search-events` tool (due to format inconsistencies)
- **Removed `program` parameter** from `search-events` tool (not supported by API)

**Migration**: Update your queries to use alternative parameters like `name`, `level`, or `season` for event filtering.

## API Tools Reference

| Tool | Description | Parameters |
|------|-------------|------------|
| `search-teams` | Find teams by number, name, or organization | `number`, `name`, `organization`, `program`, `grade`, `country` |
| `get-team-info` | Get detailed team information | `team_id` or `team_number` (required) |
| `get-team-awards` | Get all awards won by a team | `team_id` or `team_number` (required), `season`, `event` |
| `search-events` | Find events by name, date, or level | `name`, `start`, `end`, `season`, `level`, `eventTypes` |
| `get-event-details` | Get detailed event information | `event_id` (required) |
| `get-event-awards` | Get award information for events | `event_id` (required), `team`, `winner` |
| `get-team-rankings` | Get team rankings at events | `team_id`, `event_id`, `season` |
| `get-skills-scores` | Get robot skills scores | `team_id`, `event_id`, `season` |
| `search-forum` | Search VEX Forum for topics and posts | `query`, `category`, `user`, `order`, `before`, `after`, `max_results` |
| `get-forum-topic` | Get a forum topic with posts | `topic_id`, `max_posts`, `include_raw` |
| `get-forum-post` | Get a single forum post | `post_id` |
| `get-forum-user` | Get forum user profile | `username` |
| `list-forum-categories` | List all forum categories | None |
| `get-latest-forum-topics` | Get latest forum topics | `category_slug`, `category_id`, `page`, `max_results` |
| `analyze-match-opponents` | Analyze match opponents and teammates with their award history | `team_id` or `team_number`, `event_id` or `event_sku` |

## Match Analysis Tool Details

The `analyze-match-opponents` tool helps you scout and prepare for competition matches by showing you the award history of your teammates and opponents.

### Use Case

Perfect for pre-competition preparation:
1. Look up all your scheduled matches at an upcoming event
2. See which teams you'll be paired with and against
3. Review each team's recent award history
4. Plan strategy based on opponent competitive background

### Parameters

- **team_id** or **team_number**: Your team (either ID like `123456` or number like `"10085A"`)
- **event_id** or **event_sku**: The event to analyze (either ID like `54321` or SKU like `"RE-VRC-24-1234"`)

### What You Get

For each match, the tool shows:
- **Match information**: Name and scheduled time
- **Your Alliance**: Your teammate teams and their recent awards
- **Opponent Alliance**: Opposing teams and their recent awards

Awards are displayed with event context (e.g., "Excellence Award (World Championship, VRC 2024-2025)") to give you a complete picture of each team's competitive history.

### Example Usage

```
User: "Analyze my matches for team 10085A at event 54321"

Returns:
- List of all matches
- For each match:
  - Teammate teams with their recent awards
  - Opponent teams with their recent awards
  - Award details including event name and season
```

### Example Output

```
## Match Q1
Time: 2024-03-15 10:30:00

### Your Alliance (10085A)
**Teammates**:
- 12345B Team Rocket
  - Recent awards: Excellence Award (State Championship, VRC 2024-2025); Tournament Champions (Regional Qualifier, VRC 2024-2025)

### Opponent Alliance
- 99999C Blue Devils
  - Recent awards: Design Award (Signature Event, VRC 2024-2025); Robot Skills Champion (State Championship, VRC 2023-2024)
- 88888D Green Machine
  - No recent awards found
```

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

- **NPM Package**: https://www.npmjs.com/package/vex-mcp-server
- **Issues**: Report bugs at [GitHub Issues](https://github.com/yangjack8192/vex-mcp-server/issues)
- **VEX Community**: Discuss at [VEX Forum](https://www.vexforum.com/)
- **RobotEvents API**: Documentation at https://www.robotevents.com/api/v2

### Updates

**NPM users** (recommended):
```bash
npm update -g vex-mcp-server
```

**Development users**:
```bash
git pull origin main
npm run build
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Test your changes thoroughly
4. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.