/**
 * VEX MCP Server main class implementation
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

// Import organized modules
import { RobotEventsAuth } from "./auth/robotevents-auth.js";
import { TOOLS, TOOL_SCHEMAS, ToolName } from "./tools/index.js";
import { TeamHandlers } from "./handlers/team-handlers.js";
import { EventHandlers } from "./handlers/event-handlers.js";
import { RankingHandlers } from "./handlers/ranking-handlers.js";
import { ForumHandlers } from "./handlers/forum-handlers.js";
import { MatchHandlers } from "./handlers/match-handlers.js";

export class VEXMCPServer {
  private server: Server;
  private auth: RobotEventsAuth;

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

    // Initialize authentication
    this.auth = RobotEventsAuth.getInstance();
    this.auth.setupAuthentication();

    // Setup MCP handlers
    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    // Register list_tools handler
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: TOOLS,
      };
    });

    // Register call_tool handler
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        // Validate arguments using appropriate schema
        const schema = TOOL_SCHEMAS[name as ToolName];
        if (schema) {
          schema.parse(args);
        }

        // Route to appropriate handler based on tool name
        switch (name) {
          case "search-teams":
            return await TeamHandlers.handleSearchTeams(args || {});

          case "get-team-info":
            return await TeamHandlers.handleGetTeamInfo(args || {});

          case "get-team-awards":
            return await TeamHandlers.handleGetTeamAwards(args || {});

          case "search-events":
            return await EventHandlers.handleSearchEvents(args);

          case "get-event-details":
            return await EventHandlers.handleGetEventDetails(args || {});

          case "get-event-awards":
            return await EventHandlers.handleGetEventAwards(args as any);

          case "get-team-rankings":
            return await RankingHandlers.handleGetTeamRankings(args || {} as any);

          case "get-skills-scores":
            return await RankingHandlers.handleGetSkillsScores(args || {} as any);

          // Forum tools
          case "search-forum":
            return await ForumHandlers.handleSearchForum(args as any);

          case "get-forum-topic":
            return await ForumHandlers.handleGetForumTopic(args as any);

          case "get-forum-post":
            return await ForumHandlers.handleGetForumPost(args as any);

          case "get-forum-user":
            return await ForumHandlers.handleGetForumUser(args as any);

          case "list-forum-categories":
            return await ForumHandlers.handleListForumCategories(args || {});

          case "get-latest-forum-topics":
            return await ForumHandlers.handleGetLatestForumTopics(args || {});

          case "analyze-match-opponents":
            return await MatchHandlers.handleAnalyzeMatchOpponents(args as any);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error calling tool '${name}': ${errorMessage}`,
            },
          ],
        };
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(this.auth.getAuthStatus());
    console.error("VEX MCP Server running on stdio");
  }
}