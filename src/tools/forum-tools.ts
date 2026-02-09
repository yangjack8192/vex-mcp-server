/**
 * VEX Forum tool definitions for MCP server
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/**
 * Tool definition for searching the VEX Forum
 */
export const searchForumTool: Tool = {
  name: "search-forum",
  description: "Search the VEX Forum (vexforum.com) for topics and posts about VEX robotics. Supports filtering by category, user, date, and sorting options.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query text (required)",
      },
      category: {
        type: "string",
        description: "Category slug to filter by (e.g., 'vrc-discussion', 'programming-support', 'v5-technical-support')",
      },
      user: {
        type: "string",
        description: "Username to filter posts by a specific user",
      },
      order: {
        type: "string",
        enum: ["latest", "likes", "views", "latest_topic"],
        description: "Sort order for results",
      },
      before: {
        type: "string",
        description: "Filter results before this date (YYYY-MM-DD format)",
      },
      after: {
        type: "string",
        description: "Filter results after this date (YYYY-MM-DD format)",
      },
      max_results: {
        type: "number",
        description: "Maximum number of results to return (default: 10, max: 50)",
      },
    },
    required: ["query"],
  },
};

/**
 * Tool definition for getting a forum topic
 */
export const getForumTopicTool: Tool = {
  name: "get-forum-topic",
  description: "Get a VEX Forum topic by ID, including the topic details and posts/replies",
  inputSchema: {
    type: "object",
    properties: {
      topic_id: {
        type: "number",
        description: "The topic ID to retrieve",
      },
      max_posts: {
        type: "number",
        description: "Maximum number of posts to include (default: 10, max: 50)",
      },
      include_raw: {
        type: "boolean",
        description: "Include raw markdown content in addition to HTML (default: false)",
      },
    },
    required: ["topic_id"],
  },
};

/**
 * Tool definition for getting a single forum post
 */
export const getForumPostTool: Tool = {
  name: "get-forum-post",
  description: "Get a single VEX Forum post by its ID",
  inputSchema: {
    type: "object",
    properties: {
      post_id: {
        type: "number",
        description: "The post ID to retrieve",
      },
    },
    required: ["post_id"],
  },
};

/**
 * Tool definition for getting forum user profile
 */
export const getForumUserTool: Tool = {
  name: "get-forum-user",
  description: "Get a VEX Forum user's profile information by username",
  inputSchema: {
    type: "object",
    properties: {
      username: {
        type: "string",
        description: "The username to look up",
      },
    },
    required: ["username"],
  },
};

/**
 * Tool definition for listing forum categories
 */
export const listForumCategoriesTool: Tool = {
  name: "list-forum-categories",
  description: "List all categories available on the VEX Forum",
  inputSchema: {
    type: "object",
    properties: {},
  },
};

/**
 * Tool definition for getting latest forum topics
 */
export const getLatestForumTopicsTool: Tool = {
  name: "get-latest-forum-topics",
  description: "Get the latest topics from the VEX Forum, optionally filtered by category",
  inputSchema: {
    type: "object",
    properties: {
      category_slug: {
        type: "string",
        description: "Category slug to filter by (e.g., 'vrc-discussion', 'programming-support')",
      },
      category_id: {
        type: "number",
        description: "Category ID to filter by (required if category_slug is provided)",
      },
      page: {
        type: "number",
        description: "Page number for pagination (default: 0)",
      },
      max_results: {
        type: "number",
        description: "Maximum number of topics to return (default: 20, max: 50)",
      },
    },
  },
};

/**
 * Zod schemas for parameter validation
 */
export const SearchForumParamsSchema = z.object({
  query: z.string().min(1, "Search query is required"),
  category: z.string().optional(),
  user: z.string().optional(),
  order: z.enum(["latest", "likes", "views", "latest_topic"]).optional(),
  before: z.string().optional(),
  after: z.string().optional(),
  max_results: z.number().int().min(1).max(50).optional(),
});

export const GetForumTopicParamsSchema = z.object({
  topic_id: z.number().int().positive("Topic ID must be a positive integer"),
  max_posts: z.number().int().min(1).max(50).optional(),
  include_raw: z.boolean().optional(),
});

export const GetForumPostParamsSchema = z.object({
  post_id: z.number().int().positive("Post ID must be a positive integer"),
});

export const GetForumUserParamsSchema = z.object({
  username: z.string().min(1, "Username is required"),
});

export const ListForumCategoriesParamsSchema = z.object({});

export const GetLatestForumTopicsParamsSchema = z.object({
  category_slug: z.string().optional(),
  category_id: z.number().int().positive().optional(),
  page: z.number().int().min(0).optional(),
  max_results: z.number().int().min(1).max(50).optional(),
});
