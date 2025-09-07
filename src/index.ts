#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as robotevents from "robotevents";
import { z } from "zod";
import {
  VEXTeam,
  VEXEvent,
  VEXRanking,
  VEXSkillsRun,
  SearchTeamsParams,
  SearchEventsParams,
  GetTeamRankingsParams,
  GetSkillsScoresParams,
} from "./types.js";

class VEXMCPServer {
  private server: Server;
  private isAuthenticated: boolean = false;

  constructor() {
    this.server = new Server(
      {
        name: "vex-mcp-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupRobotEventsAuth();
    this.setupTools();
    this.setupToolHandlers();
  }

  private setupRobotEventsAuth(): void {
    const token = process.env.ROBOTEVENTS_TOKEN;
    if (!token) {
      console.error("Warning: ROBOTEVENTS_TOKEN environment variable not set");
      return;
    }

    try {
      robotevents.authentication.setBearer(token);
      this.isAuthenticated = true;
    } catch (error) {
      console.error("Failed to set RobotEvents authentication:", error);
    }
  }

  private setupTools(): void {
    const tools: Tool[] = [
      {
        name: "search-teams",
        description: "Search for VEX teams by number, name, organization, or location",
        inputSchema: {
          type: "object",
          properties: {
            number: {
              type: "string",
              description: "Team number to search for (e.g., '123A')",
            },
            team_name: {
              type: "string",
              description: "Team name to search for",
            },
            organization: {
              type: "string", 
              description: "Organization/school name to search for",
            },
            location: {
              type: "string",
              description: "Location (city, region, or country) to search for",
            },
            program: {
              type: ["string", "number"],
              description: "Program to filter by (e.g., 'VRC', 'VIQC', 'VEXU' or program ID)",
            },
            grade: {
              type: "string",
              description: "Grade level to filter by (e.g., 'Elementary', 'Middle School', 'High School')",
            },
            registered: {
              type: "boolean",
              description: "Filter by registration status",
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "get-team-info",
        description: "Get detailed information about a specific VEX team",
        inputSchema: {
          type: "object",
          properties: {
            team_id: {
              type: "number",
              description: "The team ID to get information for",
            },
            team_number: {
              type: "string",
              description: "Alternatively, specify team number (e.g., '123A')",
            },
          },
          additionalProperties: false,
          oneOf: [
            { required: ["team_id"] },
            { required: ["team_number"] }
          ],
        },
      },
      {
        name: "search-events",
        description: "Search for VEX events by name, location, date, or program",
        inputSchema: {
          type: "object",
          properties: {
            sku: {
              type: "string",
              description: "Event SKU to search for",
            },
            name: {
              type: "string",
              description: "Event name to search for",
            },
            start: {
              type: "string",
              description: "Start date filter (YYYY-MM-DD format)",
            },
            end: {
              type: "string", 
              description: "End date filter (YYYY-MM-DD format)",
            },
            season: {
              type: "number",
              description: "Season ID to filter by",
            },
            program: {
              type: ["string", "number"],
              description: "Program to filter by (e.g., 'VRC', 'VIQC', 'VEXU' or program ID)",
            },
            location: {
              type: "string",
              description: "Location (city, region, or country) to search for",
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "get-event-details",
        description: "Get detailed information about a specific VEX event",
        inputSchema: {
          type: "object",
          properties: {
            event_id: {
              type: "number",
              description: "The event ID to get information for",
            },
            sku: {
              type: "string",
              description: "Alternatively, specify event SKU",
            },
          },
          additionalProperties: false,
          oneOf: [
            { required: ["event_id"] },
            { required: ["sku"] }
          ],
        },
      },
      {
        name: "get-team-rankings",
        description: "Get team rankings and performance at events",
        inputSchema: {
          type: "object",
          properties: {
            team_id: {
              type: "number",
              description: "The team ID to get rankings for",
            },
            event_id: {
              type: "number",
              description: "Optional: specific event ID to get rankings for",
            },
            season: {
              type: "number",
              description: "Optional: season ID to filter by",
            },
          },
          required: ["team_id"],
          additionalProperties: false,
        },
      },
      {
        name: "get-skills-scores",
        description: "Get robot skills scores for teams",
        inputSchema: {
          type: "object",
          properties: {
            team_id: {
              type: "number",
              description: "Optional: specific team ID to get skills for",
            },
            event_id: {
              type: "number", 
              description: "Optional: specific event ID to get skills for",
            },
            season: {
              type: "number",
              description: "Optional: season ID to filter by",
            },
            type: {
              type: "string",
              enum: ["driver", "programming"],
              description: "Optional: filter by skills type (driver or programming)",
            },
          },
          additionalProperties: false,
        },
      },
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.isAuthenticated) {
        throw new Error("RobotEvents authentication not set. Please set ROBOTEVENTS_TOKEN environment variable.");
      }

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search-teams":
            return await this.handleSearchTeams(args as SearchTeamsParams);
          case "get-team-info":
            return await this.handleGetTeamInfo(args as { team_id?: number; team_number?: string });
          case "search-events":
            return await this.handleSearchEvents(args as SearchEventsParams | undefined);
          case "get-event-details":
            return await this.handleGetEventDetails(args as { event_id?: number; sku?: string });
          case "get-team-rankings":
            return await this.handleGetTeamRankings((args || {}) as unknown as GetTeamRankingsParams);
          case "get-skills-scores":
            return await this.handleGetSkillsScores((args || {}) as GetSkillsScoresParams);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new Error(`Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private async handleSearchTeams(args: SearchTeamsParams) {
    const searchParams: any = {};
    
    if (args.number) searchParams["number[]"] = [args.number];
    if (args.team_name) searchParams.team_name = args.team_name;
    if (args.organization) searchParams.organization = args.organization;
    if (args.location) {
      searchParams["location.city"] = args.location;
    }
    if (args.program) {
      if (typeof args.program === 'string') {
        const programMap: { [key: string]: number } = {
          'VRC': 1,
          'VIQC': 41,
          'VEXU': 4,
        };
        searchParams["program[]"] = [programMap[args.program.toUpperCase()] || args.program];
      } else {
        searchParams["program[]"] = [args.program];
      }
    }
    if (args.grade) searchParams.grade = args.grade;
    if (args.registered !== undefined) searchParams.registered = args.registered;

    const teams = await robotevents.teams.search(searchParams);
    
    return {
      content: [
        {
          type: "text",
          text: `Found ${teams.length} teams:\n\n` + 
                teams.map((team: any) => 
                  `**${team.number}** - ${team.team_name}\n` +
                  `Organization: ${team.organization}\n` +
                  `Location: ${team.location?.city || 'N/A'}, ${team.location?.region || 'N/A'}, ${team.location?.country || 'N/A'}\n` +
                  `Program: ${team.program?.name || 'N/A'}\n` +
                  `Grade: ${team.grade || 'N/A'}\n` +
                  `Registered: ${team.registered ? 'Yes' : 'No'}\n`
                ).join('\n'),
        },
      ],
    };
  }

  private async handleGetTeamInfo(args: { team_id?: number; team_number?: string }) {
    let team: any;
    
    if (args.team_id) {
      team = await robotevents.teams.get(args.team_id);
      if (!team) {
        throw new Error(`Team with ID ${args.team_id} not found`);
      }
    } else if (args.team_number) {
      const searchResult = await robotevents.teams.search({ number: [args.team_number] });
      if (searchResult.length === 0) {
        throw new Error(`Team ${args.team_number} not found`);
      }
      team = searchResult[0];
    } else {
      throw new Error("Either team_id or team_number must be provided");
    }

    return {
      content: [
        {
          type: "text",
          text: `**Team ${team.number}** - ${team.team_name}\n` +
                `${team.robot_name ? `Robot Name: ${team.robot_name}\n` : ''}` +
                `Organization: ${team.organization || 'N/A'}\n` +
                `Program: ${team.program?.name || 'N/A'} (${team.program?.code || 'N/A'})\n` +
                `Grade: ${team.grade || 'N/A'}\n` +
                `Location: ${[team.location?.city, team.location?.region, team.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                `${team.location?.venue ? `Venue: ${team.location.venue}\n` : ''}` +
                `Registered: ${team.registered ? 'Yes' : 'No'}\n` +
                `Team ID: ${team.id}`,
        },
      ],
    };
  }

  private async handleSearchEvents(args?: SearchEventsParams) {
    try {
      // Ensure args is not undefined - this was causing the crash
      const params = args || {};
      const searchParams: any = {};
      
      console.error(`[DEBUG] Raw args:`, args);
      console.error(`[DEBUG] Processed params:`, params);
      
      // Fix parameter formats based on robotevents package expectations
      if (params.sku) searchParams.sku = [params.sku];
      if (params.name) searchParams.name = params.name;
      if (params.start) searchParams.start = params.start;
      if (params.end) searchParams.end = params.end;
      if (params.season) searchParams.season = [params.season];
      if (params.program) {
        if (typeof params.program === 'string') {
          const programMap: { [key: string]: number } = {
            'VRC': 1,
            'VIQC': 41, 
            'VEXU': 4,
          };
          searchParams.program = [programMap[params.program.toUpperCase()] || params.program];
        } else {
          searchParams.program = [params.program];
        }
      }
      if (params.location) {
        // Try different location parameter formats
        searchParams.city = params.location;
      }

      console.error(`[DEBUG] Search parameters: ${JSON.stringify(searchParams)}`);
      const events = await robotevents.events.search(searchParams);
      console.error(`[DEBUG] API returned ${events.length} events`);
      
      return {
        content: [
          {
            type: "text", 
            text: `Found ${events.length} events:\n\n` +
                  events.map((event: any) => 
                    `**${event.name}** (${event.sku})\n` +
                    `Date: ${new Date(event.start).toLocaleDateString()} - ${new Date(event.end).toLocaleDateString()}\n` +
                    `Location: ${[event.location?.city, event.location?.region, event.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                    `Program: ${event.program?.name || 'N/A'}\n` +
                    `Season: ${event.season?.name || 'N/A'}\n` +
                    `Event ID: ${event.id}\n`
                  ).join('\n'),
          },
        ],
      };
    } catch (error) {
      console.error(`[ERROR] Search events failed:`, error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error searching events: ${error instanceof Error ? error.message : String(error)}\n\n` +
                  `Parameters used: ${JSON.stringify(args)}\n` +
                  `Please check your search parameters and try again.`,
          },
        ],
      };
    }
  }

  private async handleGetEventDetails(args: { event_id?: number; sku?: string }) {
    let event: any;
    
    if (args.event_id) {
      event = await robotevents.events.get(args.event_id);
      if (!event) {
        throw new Error(`Event with ID ${args.event_id} not found`);
      }
    } else if (args.sku) {
      const searchResult = await robotevents.events.search({ sku: [args.sku] });
      if (searchResult.length === 0) {
        throw new Error(`Event ${args.sku} not found`);
      }
      event = searchResult[0];
    } else {
      throw new Error("Either event_id or sku must be provided");
    }

    return {
      content: [
        {
          type: "text",
          text: `**${event.name}** (${event.sku})\n` +
                `Date: ${new Date(event.start).toLocaleDateString()} - ${new Date(event.end).toLocaleDateString()}\n` +
                `Program: ${event.program?.name || 'N/A'} (${event.program?.code || 'N/A'})\n` +
                `Season: ${event.season?.name || 'N/A'}\n` +
                `Location: ${[event.location?.city, event.location?.region, event.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                `${event.location?.venue ? `Venue: ${event.location.venue}\n` : ''}` +
                `${event.location?.address_1 ? `Address: ${event.location.address_1}\n` : ''}` +
                `Divisions: ${event.divisions?.map((d: any) => d.name).join(', ') || 'N/A'}\n` +
                `Event ID: ${event.id}`,
        },
      ],
    };
  }

  private async handleGetTeamRankings(args: GetTeamRankingsParams) {
    try {
      let rankings: any;
      
      if (args.event_id) {
        rankings = await robotevents.events.get(args.event_id);
        return {
          content: [
            {
              type: "text",
              text: `Retrieved event ${rankings.name} data. Team ranking functionality requires additional API development for detailed parsing.`,
            },
          ],
        };
      } else {
        const team = await robotevents.teams.get(args.team_id);
        if (!team) {
          throw new Error(`Team with ID ${args.team_id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: `Retrieved data for team ${team.number} - ${team.team_name}. Historical ranking functionality requires additional API development.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving rankings: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleGetSkillsScores(args: GetSkillsScoresParams) {
    try {
      if (args.team_id) {
        const team = await robotevents.teams.get(args.team_id);
        if (!team) {
          throw new Error(`Team with ID ${args.team_id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: `Skills data for team ${team.number} - ${team.team_name}.\n\nNote: Skills score retrieval requires additional API development. The robotevents package may not expose a direct skills endpoint.`,
            },
          ],
        };
      } else if (args.event_id) {
        const event = await robotevents.events.get(args.event_id);
        if (!event) {
          throw new Error(`Event with ID ${args.event_id} not found`);
        }
        return {
          content: [
            {
              type: "text",
              text: `Skills data for event ${event.name}.\n\nNote: Skills score retrieval requires additional API development. The robotevents package may not expose a direct skills endpoint.`,
            },
          ],
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Skills score functionality requires additional API development. Please provide either team_id or event_id for more specific data.`,
            },
          ],
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving skills scores: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("VEX MCP server running on stdio");
  }
}

const server = new VEXMCPServer();
server.run().catch(console.error);