/**
 * Common response formatting utilities for MCP tool responses
 */

export interface MCPTextContent {
  type: "text";
  text: string;
}

export interface MCPToolResponse {
  content: MCPTextContent[];
}

/**
 * Creates a standard MCP tool response with text content
 */
export function createTextResponse(text: string) {
  return {
    content: [
      {
        type: "text",
        text: text,
      },
    ],
  };
}

/**
 * Creates an error response for MCP tools
 */
export function createErrorResponse(error: unknown, context: string) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  return createTextResponse(`Error ${context}: ${errorMessage}`);
}

/**
 * Formats a list of items into a readable text format
 */
export function formatList<T>(
  items: T[],
  formatter: (item: T) => string,
  title?: string,
  maxItems?: number
): string {
  if (items.length === 0) {
    return title ? `${title}: No items found.` : "No items found.";
  }

  let result = title ? `${title}:\n\n` : "";
  
  const displayItems = maxItems ? items.slice(0, maxItems) : items;
  
  for (const item of displayItems) {
    result += formatter(item) + "\n";
  }

  if (maxItems && items.length > maxItems) {
    result += `... and ${items.length - maxItems} more items\n`;
  }

  return result;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength - 3) + "...";
}