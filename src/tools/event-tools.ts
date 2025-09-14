/**
 * Event-related tool definitions for MCP server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Tool definition for searching events
 */
export const searchEventsTool: Tool = {
  name: "search-events",
  description: "Search for VEX robotics events by various criteria like name, region, season, program, level, or date range",
  inputSchema: {
    type: "object",
    properties: {
      sku: {
        type: "array",
        items: { type: "string" },
        description: "Event SKU codes (e.g., ['RE-VRC-23-4425', 'RE-VIQC-23-1234'])",
      },
      name: {
        type: "string",
        description: "Event name to search for (supports partial matches, filtered client-side)",
      },
      region: {
        type: "string",
        description: "Region to filter events by",
      },
      level: {
        type: "array",
        items: {
          type: "string",
          enum: ["World", "National", "State", "Signature", "Regional", "Other"]
        },
        description: "Event level(s) to filter by: World, National, State, Signature, Regional, Other",
      },
      eventTypes: {
        type: "array",
        items: {
          type: "string",
          enum: ["tournament", "league", "workshop", "virtual"]
        },
        description: "Event type(s) to filter by: tournament, league, workshop, virtual",
      },
      start: {
        type: "string",
        description: "Start date filter in YYYY-MM-DD format",
      },
      end: {
        type: "string", 
        description: "End date filter in YYYY-MM-DD format",
      },
      season: {
        type: "array",
        items: { type: "number" },
        description: "Season IDs to filter events by",
      },
      program: {
        oneOf: [
          { type: "string" },
          { type: "number" }
        ],
        description: "Program type: 'VRC' (1), 'VIQC' (41), 'VEXU' (4), or program ID number",
      },
    },
  },
};

/**
 * Tool definition for getting event details
 */
export const getEventDetailsTool: Tool = {
  name: "get-event-details",
  description: "Get detailed information about a specific VEX event by event ID or SKU code",
  inputSchema: {
    type: "object",
    properties: {
      event_id: {
        type: "number",
        description: "RobotEvents event ID",
      },
      sku: {
        type: "string",
        description: "Event SKU code (e.g., 'RE-VRC-23-4425')",
      },
    },
    anyOf: [
      { required: ["event_id"] },
      { required: ["sku"] }
    ],
  },
};

/**
 * Zod schemas for parameter validation
 */
export const SearchEventsParamsSchema = z.object({
  sku: z.array(z.string()).optional(),
  name: z.string().optional(),
  region: z.string().optional(),
  level: z.array(z.enum(["World", "National", "State", "Signature", "Regional", "Other"])).optional(),
  eventTypes: z.array(z.enum(["tournament", "league", "workshop", "virtual"])).optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  season: z.array(z.number()).optional(),
  program: z.union([z.string(), z.number()]).optional(),
});

export const GetEventDetailsParamsSchema = z.object({
  event_id: z.number().optional(),
  sku: z.string().optional(),
}).refine(
  (data) => data.event_id !== undefined || data.sku !== undefined,
  {
    message: "Either event_id or sku must be provided",
  }
);