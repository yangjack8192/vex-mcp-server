/**
 * Match analysis tool definitions for VEX MCP Server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Parameters for analyzing match opponents
 */
export const AnalyzeMatchOpponentsParamsSchema = z.object({
  team_id: z.number().optional(),
  team_number: z.string().optional(),
  event_id: z.number().optional(),
  event_sku: z.string().optional(),
}).refine(
  (data) => data.team_id || data.team_number,
  { message: "Either team_id or team_number is required" }
).refine(
  (data) => data.event_id || data.event_sku,
  { message: "Either event_id or event_sku is required" }
);

/**
 * Tool for analyzing match opponents and teammates
 */
export const analyzeMatchOpponentsTool: Tool = {
  name: "analyze-match-opponents",
  description: "Analyze teammates and opponents for all matches of a team at an event. Shows each team's recent award history to help understand their competitive background. Useful for pre-competition scouting and match preparation.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "number",
        description: "Team ID (either team_id or team_number required)",
      },
      team_number: {
        type: "string",
        description: "Team number like '10085A' (either team_id or team_number required)",
      },
      event_id: {
        type: "number",
        description: "Event ID (either event_id or event_sku required)",
      },
      event_sku: {
        type: "string",
        description: "Event SKU like 'RE-VRC-23-1234' (either event_id or event_sku required)",
      },
    },
  },
};
