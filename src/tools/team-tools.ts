/**
 * Team-related tool definitions for MCP server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Tool definition for searching teams
 */
export const searchTeamsTool: Tool = {
  name: "search-teams",
  description: "Search for VEX teams by various criteria like team number, event participation, country, program, or grade level",
  inputSchema: {
    type: "object",
    properties: {
      number: {
        type: "array",
        items: { type: "string" },
        description: "Team numbers to search for (e.g., ['229V', '254A'])",
      },
      event: {
        type: "array",
        items: { type: "number" },
        description: "Event IDs to search for teams that participated",
      },
      country: {
        type: "array", 
        items: { type: "string" },
        description: "Countries to filter teams by (e.g., ['United States', 'China'])",
      },
      program: {
        type: "array",
        items: { 
          type: "number",
          enum: [1, 4, 37, 41, 43, 44, 46, 47, 51, 55, 56, 57]
        },
        description: "Program IDs to filter by: VRC (1), VEXU (4), WORKSHOP (37), VIQRC (41), NRL (43), ADC (44), TVRC (46), TVIQRC (47), VRAD (51), BellAVR (55), FAC (56), VAIC (57)",
      },
      grade: {
        type: "array",
        items: { 
          type: "string",
          enum: ["Elementary School", "Middle School", "High School", "College"]
        },
        description: "Grade levels to filter by",
      },
      registered: {
        type: "boolean",
        description: "Filter by registration status",
      },
      team_name: {
        type: "string", 
        description: "Team name to search for (filtered client-side)",
      },
      organization: {
        type: "string",
        description: "Organization or school name to search for (filtered client-side)",
      },
    },
  },
};

/**
 * Tool definition for getting team information
 */
export const getTeamInfoTool: Tool = {
  name: "get-team-info",
  description: "Get detailed information about a specific VEX team by team ID or team number",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "number",
        description: "RobotEvents team ID",
      },
      team_number: {
        type: "string",
        description: "Team number (e.g., '229V')",
      },
    },
    anyOf: [
      { required: ["team_id"] },
      { required: ["team_number"] }
    ],
  },
};

/**
 * Tool definition for getting team awards
 */
export const getTeamAwardsTool: Tool = {
  name: "get-team-awards",
  description: "Get all awards won by a specific VEX team throughout their competitive history. Shows award titles, events, and seasons.",
  inputSchema: {
    type: "object",
    properties: {
      team_id: {
        type: "number",
        description: "RobotEvents team ID",
      },
      team_number: {
        type: "string",
        description: "Team number (e.g., '229V')",
      },
      season: {
        type: "array",
        items: { type: "number" },
        description: "Filter by season IDs (optional)",
      },
      event: {
        type: "array",
        items: { type: "number" },
        description: "Filter by event IDs (optional)",
      },
    },
    anyOf: [
      { required: ["team_id"] },
      { required: ["team_number"] }
    ],
  },
};

/**
 * Zod schemas for parameter validation
 */
export const SearchTeamsParamsSchema = z.object({
  number: z.array(z.string()).optional(),
  event: z.array(z.number()).optional(),
  country: z.array(z.string()).optional(),
  program: z.array(z.number()).optional(),
  grade: z.array(z.enum(["Elementary School", "Middle School", "High School", "College"])).optional(),
  registered: z.boolean().optional(),
  team_name: z.string().optional(),
  organization: z.string().optional(),
});

export const GetTeamInfoParamsSchema = z.object({
  team_id: z.number().optional(),
  team_number: z.string().optional(),
}).refine(
  (data) => data.team_id !== undefined || data.team_number !== undefined,
  {
    message: "Either team_id or team_number must be provided",
  }
);

export const GetTeamAwardsParamsSchema = z.object({
  team_id: z.number().optional(),
  team_number: z.string().optional(),
  season: z.array(z.number()).optional(),
  event: z.array(z.number()).optional(),
}).refine(
  (data) => data.team_id !== undefined || data.team_number !== undefined,
  {
    message: "Either team_id or team_number must be provided",
  }
);