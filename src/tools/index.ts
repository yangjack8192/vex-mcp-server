/**
 * Tool definitions and registration for VEX MCP Server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Import all tool definitions
import { searchTeamsTool, getTeamInfoTool } from "./team-tools.js";
import { searchEventsTool, getEventDetailsTool } from "./event-tools.js";
import { getTeamRankingsTool, getSkillsScoresTool } from "./ranking-tools.js";

// Import validation schemas
import { 
  SearchTeamsParamsSchema, 
  GetTeamInfoParamsSchema 
} from "./team-tools.js";
import { 
  SearchEventsParamsSchema, 
  GetEventDetailsParamsSchema 
} from "./event-tools.js";
import { 
  GetTeamRankingsParamsSchema, 
  GetSkillsScoresParamsSchema 
} from "./ranking-tools.js";

/**
 * All available MCP tools
 */
export const TOOLS: Tool[] = [
  searchTeamsTool,
  getTeamInfoTool,
  searchEventsTool,
  getEventDetailsTool,
  getTeamRankingsTool,
  getSkillsScoresTool,
];

/**
 * Validation schemas mapped by tool name
 */
export const TOOL_SCHEMAS = {
  "search-teams": SearchTeamsParamsSchema,
  "get-team-info": GetTeamInfoParamsSchema,
  "search-events": SearchEventsParamsSchema,
  "get-event-details": GetEventDetailsParamsSchema,
  "get-team-rankings": GetTeamRankingsParamsSchema,
  "get-skills-scores": GetSkillsScoresParamsSchema,
} as const;

/**
 * Tool names for type safety
 */
export type ToolName = keyof typeof TOOL_SCHEMAS;