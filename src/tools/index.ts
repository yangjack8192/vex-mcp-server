/**
 * Tool definitions and registration for VEX MCP Server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Import all tool definitions
import { searchTeamsTool, getTeamInfoTool, getTeamAwardsTool } from "./team-tools.js";
import { searchEventsTool, getEventDetailsTool, getEventAwardsTool } from "./event-tools.js";
import { getTeamRankingsTool, getSkillsScoresTool } from "./ranking-tools.js";
import {
  searchForumTool,
  getForumTopicTool,
  getForumPostTool,
  getForumUserTool,
  listForumCategoriesTool,
  getLatestForumTopicsTool,
} from "./forum-tools.js";
import { analyzeMatchOpponentsTool } from "./match-tools.js";

// Import validation schemas
import {
  SearchTeamsParamsSchema,
  GetTeamInfoParamsSchema,
  GetTeamAwardsParamsSchema
} from "./team-tools.js";
import {
  SearchEventsParamsSchema,
  GetEventDetailsParamsSchema,
  GetEventAwardsParamsSchema
} from "./event-tools.js";
import {
  GetTeamRankingsParamsSchema,
  GetSkillsScoresParamsSchema
} from "./ranking-tools.js";
import {
  SearchForumParamsSchema,
  GetForumTopicParamsSchema,
  GetForumPostParamsSchema,
  GetForumUserParamsSchema,
  ListForumCategoriesParamsSchema,
  GetLatestForumTopicsParamsSchema,
} from "./forum-tools.js";
import { AnalyzeMatchOpponentsParamsSchema } from "./match-tools.js";

/**
 * All available MCP tools
 */
export const TOOLS: Tool[] = [
  // Team tools
  searchTeamsTool,
  getTeamInfoTool,
  getTeamAwardsTool,
  // Event tools
  searchEventsTool,
  getEventDetailsTool,
  getEventAwardsTool,
  // Ranking tools
  getTeamRankingsTool,
  getSkillsScoresTool,
  // Forum tools
  searchForumTool,
  getForumTopicTool,
  getForumPostTool,
  getForumUserTool,
  listForumCategoriesTool,
  getLatestForumTopicsTool,
  // Match analysis tools
  analyzeMatchOpponentsTool,
];

/**
 * Validation schemas mapped by tool name
 */
export const TOOL_SCHEMAS = {
  // Team tools
  "search-teams": SearchTeamsParamsSchema,
  "get-team-info": GetTeamInfoParamsSchema,
  "get-team-awards": GetTeamAwardsParamsSchema,
  // Event tools
  "search-events": SearchEventsParamsSchema,
  "get-event-details": GetEventDetailsParamsSchema,
  "get-event-awards": GetEventAwardsParamsSchema,
  // Ranking tools
  "get-team-rankings": GetTeamRankingsParamsSchema,
  "get-skills-scores": GetSkillsScoresParamsSchema,
  // Forum tools
  "search-forum": SearchForumParamsSchema,
  "get-forum-topic": GetForumTopicParamsSchema,
  "get-forum-post": GetForumPostParamsSchema,
  "get-forum-user": GetForumUserParamsSchema,
  "list-forum-categories": ListForumCategoriesParamsSchema,
  "get-latest-forum-topics": GetLatestForumTopicsParamsSchema,
  // Match analysis tools
  "analyze-match-opponents": AnalyzeMatchOpponentsParamsSchema,
} as const;

/**
 * Tool names for type safety
 */
export type ToolName = keyof typeof TOOL_SCHEMAS;