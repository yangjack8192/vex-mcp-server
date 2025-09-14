/**
 * Ranking and skills-related tool definitions for MCP server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Tool definition for getting team rankings
 */
export const getTeamRankingsTool: Tool = {
  name: "get-team-rankings",
  description: "Get ranking information for VEX teams, either for a specific event or a team's historical rankings",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "number",
        description: "Team ID to get historical rankings for",
      },
      event_id: {
        type: "number", 
        description: "Event ID to get rankings for all teams at that event",
      },
      season: {
        type: "array",
        items: { type: "number" },
        description: "Season IDs to filter rankings by (optional)",
      },
    },
    anyOf: [
      { required: ["team_id"] },
      { required: ["event_id"] }
    ],
  },
};

/**
 * Tool definition for getting skills scores
 */
export const getSkillsScoresTool: Tool = {
  name: "get-skills-scores",
  description: "Get skills scores for VEX teams, either for a specific event or a team's skills history",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "number",
        description: "Team ID to get skills history for",
      },
      event_id: {
        type: "number",
        description: "Event ID to get skills scores for all teams at that event",
      },
      season: {
        type: "array",
        items: { type: "number" },
        description: "Season IDs to filter skills by (optional)",
      },
      type: {
        type: "string",
        enum: ["driver", "programming"],
        description: "Type of skills to filter by (driver or programming)",
      },
    },
    anyOf: [
      { required: ["team_id"] },
      { required: ["event_id"] }
    ],
  },
};

/**
 * Zod schemas for parameter validation
 */
export const GetTeamRankingsParamsSchema = z.object({
  team_id: z.number().optional(),
  event_id: z.number().optional(),
  season: z.array(z.number()).optional(),
}).refine(
  (data) => data.team_id !== undefined || data.event_id !== undefined,
  {
    message: "Either team_id or event_id must be provided",
  }
);

export const GetSkillsScoresParamsSchema = z.object({
  team_id: z.number().optional(),
  event_id: z.number().optional(),
  season: z.array(z.number()).optional(),
  type: z.enum(["driver", "programming"]).optional(),
}).refine(
  (data) => data.team_id !== undefined || data.event_id !== undefined,
  {
    message: "Either team_id or event_id must be provided",
  }
);