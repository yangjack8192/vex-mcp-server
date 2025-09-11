# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-01-11

### Added
- Initial release of VEX MCP Server
- Model Context Protocol server for VEX Robotics Competition data
- 6 core tools for VEX data access:
  - `search-teams` - Search for VEX teams by number, name, organization, or location
  - `get-team-info` - Get detailed information about a specific team
  - `search-events` - Search for VEX events with hybrid web search + API approach
  - `get-event-details` - Get detailed information about a specific event
  - `get-team-rankings` - Get team rankings and performance at events
  - `get-skills-scores` - Get robot skills scores for teams

### Features
- **Advanced Hybrid Search System**
  - Web search integration with multiple search engines (DuckDuckGo, Bing, Google)
  - Intelligent URL extraction from search results with 12+ regex patterns
  - Event ID extraction and validation for VEX SKU formats
  - Automatic search engine redirect handling and URL decoding

- **Robust API Integration**
  - RobotEvents API integration with authentication support
  - Intelligent retry mechanisms with error classification
  - Multiple API call strategies (string ID, numeric ID, SKU search)
  - Comprehensive error handling for network issues and rate limits

- **Comprehensive Debugging**
  - Detailed step-by-step execution logging
  - Real-time debug output for troubleshooting
  - Error categorization and retry logic
  - Performance monitoring and success rate tracking

- **Testing Infrastructure**
  - Multiple testing scripts for different scenarios
  - API-only testing for direct functionality validation
  - Hybrid search testing with real token support
  - Interactive and automated testing modes

- **Development Tools**
  - TypeScript support with full type definitions
  - Comprehensive build and test scripts
  - Environment variable configuration support
  - Development debugging utilities

### Technical Details
- **Supported VEX Programs**: VRC (High School), VIQC (Elementary/Middle School), VEXU (College)
- **Node.js Requirement**: 18.0.0 or higher
- **Dependencies**: @modelcontextprotocol/sdk, robotevents, zod
- **License**: MIT License

### Documentation
- Complete installation and setup guide
- Claude Desktop integration instructions
- API tools reference with parameter documentation
- Troubleshooting guide for common issues
- Contributing guidelines for community development

### Tested Functionality
- Successfully tested with real RobotEvents API token
- Verified hybrid search finding 51+ VEX events
- Confirmed all 6 MCP tools working correctly
- Validated Claude Desktop integration

## [Unreleased]

### Planned
- NPM package publication for easy installation
- Docker containerization for deployment
- Additional search filters and parameters
- Performance optimizations and caching
- Extended documentation and tutorials

---

## Release Notes

### v1.0.0 Highlights
This initial release provides a fully functional MCP server for VEX robotics data with advanced search capabilities. The hybrid search system overcomes API limitations by combining web search with direct API calls, ensuring reliable event discovery even when direct API searches fail.

The server has been extensively tested and validated with real RobotEvents API credentials, successfully retrieving comprehensive VEX competition data including teams, events, rankings, and skills scores.

**For Developers**: Complete TypeScript implementation with comprehensive type definitions and extensive testing infrastructure.

**For VEX Community**: Easy integration with Claude Desktop for natural language VEX data queries.

**For Organizations**: MIT licensed open source project ready for deployment and customization.