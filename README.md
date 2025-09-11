# VEX MCP Server

A Model Context Protocol (MCP) server for VEX Robotics Competition data using the RobotEvents API.

## Features

- **search-teams**: Search for VEX teams by number, name, organization, or location
- **get-team-info**: Get detailed information about a specific team
- **search-events**: Search for VEX events by name, location, date, or program
- **get-event-details**: Get detailed information about a specific event
- **get-team-rankings**: Get team rankings and performance at events  
- **get-skills-scores**: Get robot skills scores for teams

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Get a RobotEvents API token:
   - Visit https://www.robotevents.com/api/v2
   - Request API access
   - Set your token as an environment variable:
   ```bash
   export ROBOTEVENTS_TOKEN="your-token-here"
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Test the server:
   ```bash
   npm run dev
   ```

## Usage with Claude Desktop

Add this server to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "vex-robotics": {
      "command": "node",
      "args": ["/path/to/vex_mcp/build/index.js"],
      "env": {
        "ROBOTEVENTS_TOKEN": "your-token-here"
      }
    }
  }
}
```

## Supported Programs

- **VRC**: VEX Robotics Competition (High School)
- **VIQC**: VEX IQ Challenge (Elementary/Middle School)
- **VEXU**: VEX U (College)

## Example Queries

- "Find teams with number 123A"
- "Search for VEX events in California" 
- "Get information about team 12345"
- "Show skills scores for event 56789"
- "Find rankings for team at specific event"

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.