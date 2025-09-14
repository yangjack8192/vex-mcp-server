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
  description: "Search for VEX robotics events by various criteria like name, location, season, program, or date range",
  inputSchema: {
    type: "object",
    properties: {
      sku: {
        type: "string",
        description: "Event SKU code (e.g., 'RE-VRC-23-4425')",
      },
      name: {
        type: "string",
        description: "Event name to search for (supports partial matches)",
      },
      location: {
        type: "string",
        description: "City, region, or location to search for events",
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
        type: "number",
        description: "Season ID to filter events by",
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
  sku: z.string().optional(),
  name: z.string().optional(),
  location: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  season: z.number().optional(),
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