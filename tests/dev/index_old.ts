#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as robotevents from "robotevents";
import { z } from "zod";
import https from 'https';
import http from 'http';
import {
  VEXTeam,
  VEXEvent,
  VEXRanking,
  VEXSkillsRun,
  SearchTeamsParams,
  SearchEventsParams,
  GetTeamRankingsParams,
  GetSkillsScoresParams,
} from "./types.js";

class VEXMCPServer {
  private server: Server;
  private isAuthenticated: boolean = false;

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

    this.setupRobotEventsAuth();
    this.setupTools();
    this.setupToolHandlers();
  }

  private setupRobotEventsAuth(): void {
    const token = process.env.ROBOTEVENTS_TOKEN;
    if (!token) {
      console.error("Warning: ROBOTEVENTS_TOKEN environment variable not set");
      return;
    }

    try {
      robotevents.authentication.setBearer(token);
      this.isAuthenticated = true;
    } catch (error) {
      console.error("Failed to set RobotEvents authentication:", error);
    }
  }

  // Helper method for web search
  private async searchWeb(query: string): Promise<string[]> {
    console.error(`[DEBUG] ======= WEB SEARCH STARTING =======`);
    console.error(`[DEBUG] Search query: "${query}"`);
    
    // Try multiple search strategies
    const searchStrategies = [
      {
        name: 'DuckDuckGo HTML',
        url: `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query + ' site:robotevents.com')}`
      },
      {
        name: 'Bing',
        url: `https://www.bing.com/search?q=${encodeURIComponent(query + ' site:robotevents.com')}`
      },
      {
        name: 'Google',
        url: `https://www.google.com/search?q=${encodeURIComponent(query + ' site:robotevents.com')}`
      }
    ];
    
    for (const strategy of searchStrategies) {
      try {
        console.error(`[DEBUG] Trying search strategy: ${strategy.name}`);
        console.error(`[DEBUG] Search URL: ${strategy.url}`);
        
        console.error(`[DEBUG] Making HTTP request...`);
        const response = await this.makeHttpRequest(strategy.url);
        console.error(`[DEBUG] HTTP response length: ${response.length} characters`);
        console.error(`[DEBUG] Response preview: ${response.substring(0, 200)}...`);
        
        // Check if we got a valid HTML response (not blocked)
        if (response.includes('<html') && !response.includes('Just a moment')) {
          console.error(`[DEBUG] ✅ Got valid HTML response from ${strategy.name}`);
          
          // Extract robotevents.com URLs from the response
          console.error(`[DEBUG] Extracting robotevents URLs...`);
          const robotEventsUrls = this.extractRobotEventsUrls(response);
          console.error(`[DEBUG] Found ${robotEventsUrls.length} robotevents URLs:`);
          robotEventsUrls.forEach((url, i) => {
            console.error(`[DEBUG]   ${i + 1}. ${url}`);
          });
          
          if (robotEventsUrls.length > 0) {
            console.error(`[DEBUG] ✅ ${strategy.name} found results!`);
            console.error(`[DEBUG] ======= WEB SEARCH COMPLETED =======`);
            return robotEventsUrls;
          }
        } else {
          console.error(`[DEBUG] ❌ ${strategy.name} blocked or invalid response`);
        }
        
      } catch (error) {
        console.error(`[ERROR] ${strategy.name} search failed:`, error instanceof Error ? error.message : String(error));
        // Continue to next strategy
      }
    }
    
    console.error(`[ERROR] All search strategies failed`);
    console.error(`[DEBUG] ======= WEB SEARCH FAILED =======`);
    return [];
  }

  // HTTP request helper
  private async makeHttpRequest(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const urlObj = new URL(url);
      const client = urlObj.protocol === 'https:' ? https : http;
      
      const options = {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity', // Don't request compression to avoid decode issues
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      };
      
      console.error(`[DEBUG] HTTP request options:`, JSON.stringify(options.headers));
      
      const req = client.request(url, options, (res) => {
        console.error(`[DEBUG] HTTP response status: ${res.statusCode}`);
        console.error(`[DEBUG] HTTP response headers:`, JSON.stringify(res.headers));
        
        let data = '';
        
        // Handle different encodings
        if (res.headers['content-encoding'] === 'gzip') {
          console.error(`[DEBUG] Response is gzip encoded, need to decompress`);
          const zlib = require('zlib');
          const gunzip = zlib.createGunzip();
          res.pipe(gunzip);
          gunzip.on('data', (chunk: any) => data += chunk);
          gunzip.on('end', () => {
            console.error(`[DEBUG] Decompressed response length: ${data.length}`);
            resolve(data);
          });
          gunzip.on('error', reject);
        } else {
          res.on('data', (chunk: any) => data += chunk);
          res.on('end', () => {
            console.error(`[DEBUG] Raw response length: ${data.length}`);
            resolve(data);
          });
        }
      });
      
      req.on('error', (error) => {
        console.error(`[DEBUG] HTTP request error:`, error);
        reject(error);
      });
      
      req.setTimeout(15000, () => {
        console.error(`[DEBUG] HTTP request timeout after 15s`);
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.end();
    });
  }

  // Extract robotevents.com URLs from HTML content
  private extractRobotEventsUrls(html: string): string[] {
    console.error(`[DEBUG] ======= URL EXTRACTION STARTING =======`);
    const urls: string[] = [];
    
    // More comprehensive URL patterns for robotevents.com
    const patterns = [
      // Complete URLs with protocol
      { name: 'Full event URLs', regex: /https?:\/\/(?:www\.)?robotevents\.com\/robot-competitions\/[^"'\s<>)]+/gi },
      { name: 'Events path URLs', regex: /https?:\/\/(?:www\.)?robotevents\.com\/events\/[^"'\s<>)]+/gi },
      { name: 'Any robotevents URLs', regex: /https?:\/\/(?:www\.)?robotevents\.com\/[^"'\s<>)]+/gi },
      
      // URLs without protocol
      { name: 'Protocol-less full', regex: /(?:www\.)?robotevents\.com\/robot-competitions\/[^"'\s<>)]+/gi },
      { name: 'Protocol-less events', regex: /(?:www\.)?robotevents\.com\/events\/[^"'\s<>)]+/gi },
      { name: 'Protocol-less any', regex: /(?:www\.)?robotevents\.com\/[^"'\s<>)]+/gi },
      
      // Quoted URLs (common in search results)
      { name: 'Quoted URLs', regex: /"(https?:\/\/(?:www\.)?robotevents\.com\/[^"]+)"/gi },
      { name: 'Href attributes', regex: /href\s*=\s*["']([^"']*robotevents\.com[^"']*?)["']/gi },
      
      // Data attributes and JSON (search engines often use these)
      { name: 'Data URLs', regex: /data-[^=]*=\s*["']([^"']*robotevents\.com[^"']*?)["']/gi },
      { name: 'URL parameters', regex: /[?&]url=([^&"'\s]*robotevents\.com[^&"'\s]*)/gi },
      
      // Search engine redirect URLs (DuckDuckGo, Bing, etc.)
      { name: 'DuckDuckGo redirects', regex: /uddg=([^&"'\s]*robotevents\.com[^&"'\s]*)/gi },
      { name: 'Search redirects', regex: /redirect[^=]*=([^&"'\s]*robotevents\.com[^&"'\s]*)/gi }
    ];
    
    console.error(`[DEBUG] Trying ${patterns.length} URL extraction patterns...`);
    
    patterns.forEach((pattern, i) => {
      console.error(`[DEBUG] Pattern ${i + 1}: ${pattern.name}`);
      let matches;
      
      if (pattern.regex.source.includes('(') && pattern.regex.source.includes(')')) {
        // Pattern has capture groups - extract the captured URL
        matches = [];
        let match;
        const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
        while ((match = regex.exec(html)) !== null) {
          if (match[1]) {
            let url = match[1];
            // Decode URL-encoded strings from search engines
            try {
              url = decodeURIComponent(url);
            } catch (e) {
              // If decoding fails, use original
            }
            matches.push(url);
          }
          if (regex.global === false) break;
        }
      } else {
        // Pattern matches the whole URL
        matches = html.match(pattern.regex) || [];
        // Also decode these URLs
        matches = matches.map(url => {
          try {
            return decodeURIComponent(url);
          } catch (e) {
            return url;
          }
        });
      }
      
      console.error(`[DEBUG]   Found ${matches.length} matches`);
      
      for (const match of matches) {
        // Clean up and normalize URL
        let url = match.trim();
        
        // Remove common trailing characters that shouldn't be part of URL
        url = url.replace(/[.,;)}>]+$/, '');
        
        // Ensure URL has protocol
        if (!url.startsWith('http')) {
          url = 'https://' + url;
        }
        
        // Validate it's actually a robotevents URL and not a search page
        if (url.includes('robotevents.com') && !urls.includes(url) && this.isValidEventUrl(url)) {
          urls.push(url);
          console.error(`[DEBUG]     Added URL: ${url}`);
        } else if (url.includes('robotevents.com')) {
          console.error(`[DEBUG]     Rejected URL (not event page): ${url}`);
        }
      }
    });
    
    // Also search for robotevents mentions in the raw HTML to see if there are any
    const robotEventsMatches = html.match(/robotevents/gi) || [];
    console.error(`[DEBUG] Found ${robotEventsMatches.length} mentions of "robotevents" in HTML`);
    
    // Try to find URL-like patterns near robotevents mentions
    if (robotEventsMatches.length > 0 && urls.length === 0) {
      console.error(`[DEBUG] No URLs found but robotevents mentioned - searching for URL patterns near mentions`);
      
      // Look for patterns that might contain event IDs
      const contextPatterns = [
        /robotevents[^"'\s<>]{0,50}[A-Z]{2}-[A-Z]{2,4}-\d{2}-\d+/gi,  // SKU patterns
        /[A-Z]{2}-[A-Z]{2,4}-\d{2}-\d+[^"'\s<>]{0,50}robotevents/gi,   // SKU before robotevents
        /\/(\d{4,})\D/g  // Numeric IDs in URLs
      ];
      
      for (const pattern of contextPatterns) {
        const matches = html.match(pattern) || [];
        if (matches.length > 0) {
          console.error(`[DEBUG] Found potential context matches:`, matches.slice(0, 3));
        }
      }
    }
    
    console.error(`[DEBUG] Total unique URLs found: ${urls.length}`);
    console.error(`[DEBUG] ======= URL EXTRACTION COMPLETED =======`);
    return urls;
  }

  // Extract event ID from robotevents URL
  private extractEventId(url: string): string | null {
    console.error(`[DEBUG] ======= EVENT ID EXTRACTION STARTING =======`);
    console.error(`[DEBUG] Input URL: ${url}`);
    
    // Try different URL patterns for event IDs - ordered by specificity
    const patterns = [
      // Most specific patterns first
      { name: 'Event SKU in events path', regex: /\/events\/([A-Z]{2}-[A-Z]{2,4}-\d{2}-\d+)/i },
      { name: 'Event SKU in competitions path', regex: /\/robot-competitions\/[^\/]*\/([A-Z]{2}-[A-Z]{2,4}-\d{2}-\d+)/i },
      { name: 'Event SKU anywhere', regex: /([A-Z]{2}-[A-Z]{2,4}-\d{2}-\d+)/i },
      
      // URL parameter patterns
      { name: 'Event ID parameter', regex: /[?&]event[_-]?id=([^&\s]+)/i },
      { name: 'ID parameter', regex: /[?&]id=([^&\s]+)/i },
      { name: 'SKU parameter', regex: /[?&]sku=([^&\s]+)/i },
      
      // Path-based patterns
      { name: 'Events path numeric', regex: /\/events\/(\d+)/i },
      { name: 'Events path alphanumeric', regex: /\/events\/([^\/\?#]+)/i },
      { name: 'Competitions path final segment', regex: /\/robot-competitions\/[^\/]*\/([^\/\?#]+)/i },
      
      // Generic patterns (lower priority)
      { name: 'Trailing numeric ID', regex: /\/(\d{4,})(?:\/|$|\?)/},
      { name: 'Any path segment with dashes', regex: /\/([a-zA-Z0-9]+-[a-zA-Z0-9]+-[a-zA-Z0-9]+)/i },
      
      // Hash/fragment patterns
      { name: 'Hash event ID', regex: /#event[_-]?id[=:]([^&\s]+)/i },
      { name: 'Hash ID', regex: /#id[=:]([^&\s]+)/i }
    ];
    
    console.error(`[DEBUG] Trying ${patterns.length} extraction patterns...`);
    
    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.error(`[DEBUG] Pattern ${i + 1} (${pattern.name}): ${pattern.regex}`);
      
      const match = url.match(pattern.regex);
      if (match && match[1]) {
        let eventId = match[1];
        console.error(`[DEBUG] ✅ MATCH: Found "${eventId}" using ${pattern.name}`);
        
        // Clean up the event ID
        eventId = this.cleanEventId(eventId);
        console.error(`[DEBUG] 🧹 Cleaned ID: "${eventId}"`);
        
        // Validate the extracted ID
        if (this.isValidEventId(eventId)) {
          console.error(`[DEBUG] ✅ SUCCESS: Event ID "${eventId}" is valid`);
          console.error(`[DEBUG] ======= EVENT ID EXTRACTION COMPLETED =======`);
          return eventId;
        } else {
          console.error(`[DEBUG] ❌ INVALID: Event ID "${eventId}" failed validation`);
        }
      } else {
        console.error(`[DEBUG] ❌ No match with ${pattern.name}`);
      }
    }
    
    console.error(`[ERROR] No valid event ID found in URL with any pattern`);
    console.error(`[DEBUG] ======= EVENT ID EXTRACTION FAILED =======`);
    return null;
  }
  
  // Validate if a URL is a real event page (not search results)
  private isValidEventUrl(url: string): boolean {
    console.error(`[DEBUG] Validating URL: ${url}`);
    
    // Must contain robotevents.com
    if (!url.includes('robotevents.com')) {
      console.error(`[DEBUG] ❌ Not a robotevents.com URL`);
      return false;
    }
    
    // Reject search result pages and other non-event URLs
    const invalidPatterns = [
      'google.com',        // Google search results
      'bing.com',          // Bing search results  
      'duckduckgo.com',    // DuckDuckGo search results
      'format=rss',        // RSS feeds
      '/search?',          // Search pages with query params
      'uddg=',             // DuckDuckGo redirect parameters (if still present)
    ];
    
    for (const pattern of invalidPatterns) {
      if (url.includes(pattern)) {
        console.error(`[DEBUG] ❌ Contains invalid pattern: ${pattern}`);
        return false;
      }
    }
    
    // Must have valid URL structure
    try {
      const urlObj = new URL(url);
      if (!urlObj.hostname) {
        console.error(`[DEBUG] ❌ Invalid URL structure`);
        return false;
      }
    } catch (error) {
      console.error(`[DEBUG] ❌ URL parsing failed: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
    
    // Should contain event-related paths
    const validPatterns = [
      '/events/',
      '/robot-competitions/',
      '/teams/',  // Sometimes team pages link to events
    ];
    
    const hasValidPattern = validPatterns.some(pattern => url.includes(pattern));
    if (hasValidPattern) {
      console.error(`[DEBUG] ✅ Valid event URL`);
      return true;
    } else {
      console.error(`[DEBUG] ❌ No valid event patterns found`);
      return false;
    }
  }

  // Clean up extracted event ID
  private cleanEventId(id: string): string {
    console.error(`[DEBUG] Cleaning event ID: "${id}"`);
    
    let cleanId = id.trim();
    
    // Remove common file extensions
    cleanId = cleanId.replace(/\.(html|htm|php|aspx?)$/i, '');
    
    // Remove leading/trailing slashes and whitespace
    cleanId = cleanId.replace(/^\/+|\/+$/g, '').trim();
    
    console.error(`[DEBUG] Cleaned result: "${cleanId}"`);
    return cleanId;
  }

  // Validate if an extracted ID looks like a valid event ID
  private isValidEventId(id: string): boolean {
    // VEX event IDs typically follow these patterns:
    // - SKU format: RE-VRC-23-1234, RE-VIQC-23-5678, etc.
    // - Numeric IDs: usually 4+ digits
    // - Should not be too generic (like single letters or very short)
    
    console.error(`[DEBUG] Validating event ID: "${id}"`);
    
    // VEX SKU format (most reliable)
    if (/^[A-Z]{2}-[A-Z]{2,4}-\d{2}-\d+$/i.test(id)) {
      console.error(`[DEBUG] ✅ Valid SKU format`);
      return true;
    }
    
    // Numeric ID (4+ digits)
    if (/^\d{4,}$/.test(id)) {
      console.error(`[DEBUG] ✅ Valid numeric ID (${id.length} digits)`);
      return true;
    }
    
    // Mixed alphanumeric (reasonable length)
    if (/^[a-zA-Z0-9-_]{6,}$/.test(id) && id.includes('-')) {
      console.error(`[DEBUG] ✅ Valid mixed alphanumeric ID`);
      return true;
    }
    
    // Reject too short or too generic IDs
    if (id.length < 3) {
      console.error(`[DEBUG] ❌ Too short (${id.length} chars)`);
      return false;
    }
    
    // Reject common non-ID strings
    const invalidIds = [
      'event', 'events', 'competition', 'robot', 'vex', 'index', 'home', 'main',
      'standings', 'skills', 'teams', 'rankings', 'awards', 'matches',
      'webcasts', 'photos', 'documents', 'about', 'contact'
    ];
    if (invalidIds.includes(id.toLowerCase())) {
      console.error(`[DEBUG] ❌ Generic non-ID string: ${id}`);
      return false;
    }
    
    console.error(`[DEBUG] ⚠️  Uncertain but accepting: "${id}"`);
    return true;
  }

  // Build search keywords for web search
  private buildSearchKeywords(params: SearchEventsParams): string {
    console.error(`[DEBUG] ======= BUILDING SEARCH KEYWORDS =======`);
    console.error(`[DEBUG] Input params:`, JSON.stringify(params));
    
    const keywords = [];
    
    if (params.name) {
      keywords.push(`"${params.name}"`);
      console.error(`[DEBUG] Added name keyword: "${params.name}"`);
    }
    
    if (params.location) {
      keywords.push(params.location);
      console.error(`[DEBUG] Added location keyword: ${params.location}`);
    }
    
    // Always add VEX and robotevents to narrow search
    keywords.push('VEX');
    keywords.push('robotevents.com');
    console.error(`[DEBUG] Added standard keywords: VEX, robotevents.com`);
    
    // Add program if specified
    if (params.program) {
      if (typeof params.program === 'string') {
        keywords.push(params.program);
        console.error(`[DEBUG] Added program keyword: ${params.program}`);
      }
    }
    
    // Add time-based keywords
    keywords.push('competition');
    keywords.push('event');
    console.error(`[DEBUG] Added time-based keywords: competition, event`);
    
    const query = keywords.join(' ');
    console.error(`[DEBUG] Final search query: "${query}"`);
    console.error(`[DEBUG] ======= SEARCH KEYWORDS COMPLETED =======`);
    return query;
  }

  private setupTools(): void {
    const tools: Tool[] = [
      {
        name: "search-teams",
        description: "Search for VEX teams by number, name, organization, or location",
        inputSchema: {
          type: "object",
          properties: {
            number: {
              type: "string",
              description: "Team number to search for (e.g., '123A')",
            },
            team_name: {
              type: "string",
              description: "Team name to search for",
            },
            organization: {
              type: "string", 
              description: "Organization/school name to search for",
            },
            location: {
              type: "string",
              description: "Location (city, region, or country) to search for",
            },
            program: {
              type: ["string", "number"],
              description: "Program to filter by (e.g., 'VRC', 'VIQC', 'VEXU' or program ID)",
            },
            grade: {
              type: "string",
              description: "Grade level to filter by (e.g., 'Elementary', 'Middle School', 'High School')",
            },
            registered: {
              type: "boolean",
              description: "Filter by registration status",
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "get-team-info",
        description: "Get detailed information about a specific VEX team",
        inputSchema: {
          type: "object",
          properties: {
            team_id: {
              type: "number",
              description: "The team ID to get information for",
            },
            team_number: {
              type: "string",
              description: "Alternatively, specify team number (e.g., '123A')",
            },
          },
          additionalProperties: false,
          oneOf: [
            { required: ["team_id"] },
            { required: ["team_number"] }
          ],
        },
      },
      {
        name: "search-events",
        description: "Search for VEX events by name, location, date, or program",
        inputSchema: {
          type: "object",
          properties: {
            sku: {
              type: "string",
              description: "Event SKU to search for",
            },
            name: {
              type: "string",
              description: "Event name to search for",
            },
            start: {
              type: "string",
              description: "Start date filter (YYYY-MM-DD format)",
            },
            end: {
              type: "string", 
              description: "End date filter (YYYY-MM-DD format)",
            },
            season: {
              type: "number",
              description: "Season ID to filter by",
            },
            program: {
              type: ["string", "number"],
              description: "Program to filter by (e.g., 'VRC', 'VIQC', 'VEXU' or program ID)",
            },
            location: {
              type: "string",
              description: "Location (city, region, or country) to search for",
            },
          },
          additionalProperties: false,
        },
      },
      {
        name: "get-event-details",
        description: "Get detailed information about a specific VEX event",
        inputSchema: {
          type: "object",
          properties: {
            event_id: {
              type: "number",
              description: "The event ID to get information for",
            },
            sku: {
              type: "string",
              description: "Alternatively, specify event SKU",
            },
          },
          additionalProperties: false,
          oneOf: [
            { required: ["event_id"] },
            { required: ["sku"] }
          ],
        },
      },
      {
        name: "get-team-rankings",
        description: "Get team rankings and performance at events",
        inputSchema: {
          type: "object",
          properties: {
            team_id: {
              type: "number",
              description: "The team ID to get rankings for",
            },
            event_id: {
              type: "number",
              description: "Optional: specific event ID to get rankings for",
            },
            season: {
              type: "number",
              description: "Optional: season ID to filter by",
            },
          },
          required: ["team_id"],
          additionalProperties: false,
        },
      },
      {
        name: "get-skills-scores",
        description: "Get robot skills scores for teams",
        inputSchema: {
          type: "object",
          properties: {
            team_id: {
              type: "number",
              description: "Optional: specific team ID to get skills for",
            },
            event_id: {
              type: "number", 
              description: "Optional: specific event ID to get skills for",
            },
            season: {
              type: "number",
              description: "Optional: season ID to filter by",
            },
            type: {
              type: "string",
              enum: ["driver", "programming"],
              description: "Optional: filter by skills type (driver or programming)",
            },
          },
          additionalProperties: false,
        },
      },
    ];

    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools,
    }));
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      if (!this.isAuthenticated) {
        throw new Error("RobotEvents authentication not set. Please set ROBOTEVENTS_TOKEN environment variable.");
      }

      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "search-teams":
            return await this.handleSearchTeams(args as SearchTeamsParams);
          case "get-team-info":
            return await this.handleGetTeamInfo(args as { team_id?: number; team_number?: string });
          case "search-events":
            return await this.handleSearchEvents(args as SearchEventsParams | undefined);
          case "get-event-details":
            return await this.handleGetEventDetails(args as { event_id?: number; sku?: string });
          case "get-team-rankings":
            return await this.handleGetTeamRankings((args || {}) as unknown as GetTeamRankingsParams);
          case "get-skills-scores":
            return await this.handleGetSkillsScores((args || {}) as GetSkillsScoresParams);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        throw new Error(`Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private async handleSearchTeams(args: SearchTeamsParams) {
    const searchParams: any = {};
    
    if (args.number) searchParams["number[]"] = [args.number];
    if (args.team_name) searchParams.team_name = args.team_name;
    if (args.organization) searchParams.organization = args.organization;
    if (args.location) {
      searchParams["location.city"] = args.location;
    }
    if (args.program) {
      if (typeof args.program === 'string') {
        const programMap: { [key: string]: number } = {
          'VRC': 1,
          'VIQC': 41,
          'VEXU': 4,
        };
        searchParams["program[]"] = [programMap[args.program.toUpperCase()] || args.program];
      } else {
        searchParams["program[]"] = [args.program];
      }
    }
    if (args.grade) searchParams.grade = args.grade;
    if (args.registered !== undefined) searchParams.registered = args.registered;

    const teams = await robotevents.teams.search(searchParams);
    
    return {
      content: [
        {
          type: "text",
          text: `Found ${teams.length} teams:\n\n` + 
                teams.map((team: any) => 
                  `**${team.number}** - ${team.team_name}\n` +
                  `Organization: ${team.organization}\n` +
                  `Location: ${team.location?.city || 'N/A'}, ${team.location?.region || 'N/A'}, ${team.location?.country || 'N/A'}\n` +
                  `Program: ${team.program?.name || 'N/A'}\n` +
                  `Grade: ${team.grade || 'N/A'}\n` +
                  `Registered: ${team.registered ? 'Yes' : 'No'}\n`
                ).join('\n'),
        },
      ],
    };
  }

  private async handleGetTeamInfo(args: { team_id?: number; team_number?: string }) {
    let team: any;
    
    if (args.team_id) {
      team = await robotevents.teams.get(args.team_id);
      if (!team) {
        throw new Error(`Team with ID ${args.team_id} not found`);
      }
    } else if (args.team_number) {
      const searchResult = await robotevents.teams.search({ number: [args.team_number] });
      if (searchResult.length === 0) {
        throw new Error(`Team ${args.team_number} not found`);
      }
      team = searchResult[0];
    } else {
      throw new Error("Either team_id or team_number must be provided");
    }

    return {
      content: [
        {
          type: "text",
          text: `**Team ${team.number}** - ${team.team_name}\n` +
                `${team.robot_name ? `Robot Name: ${team.robot_name}\n` : ''}` +
                `Organization: ${team.organization || 'N/A'}\n` +
                `Program: ${team.program?.name || 'N/A'} (${team.program?.code || 'N/A'})\n` +
                `Grade: ${team.grade || 'N/A'}\n` +
                `Location: ${[team.location?.city, team.location?.region, team.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                `${team.location?.venue ? `Venue: ${team.location.venue}\n` : ''}` +
                `Registered: ${team.registered ? 'Yes' : 'No'}\n` +
                `Team ID: ${team.id}`,
        },
      ],
    };
  }

  private async handleSearchEvents(args?: SearchEventsParams) {
    try {
      // Ensure args is not undefined - this was causing the crash
      const params = args || {};
      
      console.error(`[DEBUG] Raw args:`, args);
      console.error(`[DEBUG] Processed params:`, params);
      
      // Strategy 1: Try hybrid web search + API approach
      const webSearchResults = await this.tryWebSearchApproach(params);
      if (webSearchResults.success) {
        console.error(`[DEBUG] Web search approach succeeded`);
        return webSearchResults.response;
      }
      
      console.error(`[DEBUG] Web search approach failed, trying direct API search`);
      
      // Strategy 2: Fallback to direct API search (original approach)
      const apiSearchResults = await this.tryDirectApiSearch(params);
      if (apiSearchResults.success) {
        console.error(`[DEBUG] Direct API search succeeded`);
        return apiSearchResults.response;
      }
      
      // Both approaches failed
      console.error(`[ERROR] All search approaches failed`);
      return {
        content: [
          {
            type: "text",
            text: `❌ Unable to find events matching your criteria.\n\n` +
                  `Searched for: ${JSON.stringify(params)}\n\n` +
                  `Both web search and direct API search failed. This could be due to:\n` +
                  `- Network connectivity issues\n` +
                  `- Invalid search parameters\n` +
                  `- Temporary service unavailability\n\n` +
                  `Please try again with different search terms.`,
          },
        ],
      };
      
    } catch (error) {
      console.error(`[ERROR] Search events failed:`, error);
      return {
        content: [
          {
            type: "text",
            text: `❌ Error searching events: ${error instanceof Error ? error.message : String(error)}\n\n` +
                  `Parameters used: ${JSON.stringify(args)}\n` +
                  `Please check your search parameters and try again.`,
          },
        ],
      };
    }
  }

  // Web search + API approach
  private async tryWebSearchApproach(params: SearchEventsParams): Promise<{ success: boolean; response?: any }> {
    console.error(`[DEBUG] ======= WEB SEARCH APPROACH STARTING =======`);
    console.error(`[DEBUG] Search parameters:`, JSON.stringify(params));
    
    try {
      // Build search query
      console.error(`[DEBUG] Step 1: Building search query...`);
      const searchQuery = this.buildSearchKeywords(params);
      if (!searchQuery.trim()) {
        console.error(`[ERROR] No search query built, cannot proceed with web search`);
        console.error(`[DEBUG] ======= WEB SEARCH APPROACH ABORTED =======`);
        return { success: false };
      }
      console.error(`[DEBUG] ✅ Search query ready: "${searchQuery}"`);
      
      // Perform web search
      console.error(`[DEBUG] Step 2: Performing web search...`);
      const urls = await this.searchWeb(searchQuery);
      console.error(`[DEBUG] Web search returned ${urls.length} URLs`);
      if (urls.length === 0) {
        console.error(`[ERROR] No URLs found in web search results`);
        console.error(`[DEBUG] ======= WEB SEARCH APPROACH FAILED =======`);
        return { success: false };
      }
      console.error(`[DEBUG] ✅ Web search successful`);
      
      // Extract event IDs and fetch details
      console.error(`[DEBUG] Step 3: Extracting event IDs and fetching details...`);
      const events = [];
      const urlsToProcess = urls.slice(0, 5); // Limit to first 5 URLs
      console.error(`[DEBUG] Processing ${urlsToProcess.length} URLs (limited from ${urls.length})...`);
      
      for (let i = 0; i < urlsToProcess.length; i++) {
        const url = urlsToProcess[i];
        console.error(`[DEBUG] Processing URL ${i + 1}/${urlsToProcess.length}: ${url}`);
        
        const eventId = this.extractEventId(url);
        if (eventId) {
          console.error(`[DEBUG] ✅ Extracted event ID: "${eventId}"`);
          try {
            // Try to get event details using the extracted ID
            const event = await this.getEventById(eventId);
            if (event) {
              events.push(event);
              console.error(`[DEBUG] ✅ Successfully retrieved event: ${event.name}`);
            } else {
              console.error(`[DEBUG] ❌ Event retrieval returned null for ID: ${eventId}`);
            }
          } catch (error) {
            console.error(`[DEBUG] ❌ Failed to get event ${eventId}:`, error instanceof Error ? error.message : String(error));
            // Continue with next URL
          }
        } else {
          console.error(`[DEBUG] ❌ Could not extract event ID from URL: ${url}`);
        }
      }
      
      console.error(`[DEBUG] Event processing completed. Found ${events.length} valid events`);
      
      if (events.length === 0) {
        console.error(`[ERROR] No valid events found from any extracted IDs`);
        console.error(`[DEBUG] ======= WEB SEARCH APPROACH FAILED =======`);
        return { success: false };
      }
      
      // Format response
      console.error(`[DEBUG] Step 4: Formatting response with ${events.length} events...`);
      const response = {
        content: [
          {
            type: "text",
            text: `🔍 Found ${events.length} events via web search:\n\n` +
                  events.map((event: any) => 
                    `**${event.name}** (${event.sku || 'N/A'})\n` +
                    `Date: ${event.start ? new Date(event.start).toLocaleDateString() : 'N/A'} - ${event.end ? new Date(event.end).toLocaleDateString() : 'N/A'}\n` +
                    `Location: ${[event.location?.city, event.location?.region, event.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                    `Program: ${event.program?.name || 'N/A'}\n` +
                    `Season: ${event.season?.name || 'N/A'}\n` +
                    `Event ID: ${event.id || 'N/A'}\n`
                  ).join('\n') +
                  `\n💡 Results found using intelligent web search + API combination.`,
          },
        ],
      };
      
      console.error(`[DEBUG] ✅ Response formatted successfully`);
      console.error(`[DEBUG] ======= WEB SEARCH APPROACH COMPLETED =======`);
      return { success: true, response };
      
    } catch (error) {
      console.error(`[ERROR] Web search approach failed with exception:`, error instanceof Error ? error.message : String(error));
      console.error(`[ERROR] Stack trace:`, error instanceof Error ? error.stack : 'N/A');
      console.error(`[DEBUG] ======= WEB SEARCH APPROACH FAILED =======`);
      return { success: false };
    }
  }

  // Helper method to get event by ID (try multiple ID formats)
  private async getEventById(eventId: string): Promise<any> {
    console.error(`[DEBUG] ======= GET EVENT BY ID STARTING =======`);
    console.error(`[DEBUG] Attempting to retrieve event: "${eventId}"`);
    
    // Try different ways to get the event with improved error handling
    const attempts = [
      { name: 'String ID direct', func: async () => await robotevents.events.get(eventId) },
      { name: 'Numeric ID conversion', func: async () => {
        const numId = parseInt(eventId);
        if (isNaN(numId)) {
          throw new Error('Event ID is not numeric');
        }
        return await robotevents.events.get(numId);
      }},
      { name: 'Search by SKU', func: async () => {
        console.error(`[DEBUG] Trying search by SKU: ${eventId}`);
        const results = await robotevents.events.search({ sku: [eventId] });
        return results && results.length > 0 ? results[0] : null;
      }}
    ];
    
    console.error(`[DEBUG] Will try ${attempts.length} different API call methods with retries`);
    
    for (let i = 0; i < attempts.length; i++) {
      const attempt = attempts[i];
      console.error(`[DEBUG] Attempt ${i + 1}: ${attempt.name}`);
      
      // Retry logic for each attempt
      for (let retry = 0; retry < 2; retry++) {
        try {
          if (retry > 0) {
            console.error(`[DEBUG] Retry ${retry} for ${attempt.name}`);
            // Wait briefly before retry
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const event = await this.executeWithTimeout(attempt.func, 30000); // 30s timeout
          
          if (event) {
            console.error(`[DEBUG] ✅ SUCCESS: Retrieved event using ${attempt.name} (retry ${retry})`);
            console.error(`[DEBUG] Event details: ${event.name} (${event.sku || event.id})`);
            console.error(`[DEBUG] ======= GET EVENT BY ID COMPLETED =======`);
            return event;
          } else {
            console.error(`[DEBUG] ❌ ${attempt.name} returned null/undefined (retry ${retry})`);
            break; // No point retrying if result is null
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.error(`[DEBUG] ❌ ${attempt.name} threw error (retry ${retry}):`, errorMsg);
          
          // Check for specific error types
          if (this.isRetryableError(error)) {
            console.error(`[DEBUG] Error appears retryable, will retry if attempts remain`);
            if (retry === 1) { // Last retry
              console.error(`[DEBUG] Max retries reached for ${attempt.name}`);
            }
          } else {
            console.error(`[DEBUG] Error not retryable, skipping to next method`);
            break; // Don't retry non-retryable errors
          }
        }
      }
    }
    
    console.error(`[ERROR] All ${attempts.length} attempts to get event "${eventId}" failed with retries`);
    console.error(`[DEBUG] ======= GET EVENT BY ID FAILED =======`);
    return null;
  }
  
  // Execute a function with timeout
  private async executeWithTimeout<T>(func: () => Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      func(),
      new Promise<T>((_, reject) => 
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs)
      )
    ]);
  }
  
  // Check if an error is retryable
  private isRetryableError(error: unknown): boolean {
    if (!(error instanceof Error)) return false;
    
    const errorMsg = error.message.toLowerCase();
    
    // Network-related errors that might be temporary
    const retryablePatterns = [
      'timeout', 'network', 'connection', 'econnreset', 'enotfound', 
      'socket hang up', '503', '502', '504', 'rate limit'
    ];
    
    // Cloudflare protection is usually not retryable quickly
    const nonRetryablePatterns = [
      'just a moment', 'cloudflare', '403', 'forbidden', 'unauthorized'
    ];
    
    for (const pattern of nonRetryablePatterns) {
      if (errorMsg.includes(pattern)) {
        console.error(`[DEBUG] Non-retryable error detected: ${pattern}`);
        return false;
      }
    }
    
    for (const pattern of retryablePatterns) {
      if (errorMsg.includes(pattern)) {
        console.error(`[DEBUG] Retryable error detected: ${pattern}`);
        return true;
      }
    }
    
    // Default to not retryable for unknown errors
    return false;
  }

  // Direct API search approach (original method)
  private async tryDirectApiSearch(params: SearchEventsParams): Promise<{ success: boolean; response?: any }> {
    console.error(`[DEBUG] ======= DIRECT API SEARCH STARTING =======`);
    console.error(`[DEBUG] Input params:`, JSON.stringify(params));
    
    try {
      const searchParams: any = {};
      
      // Build search parameters with improved validation
      console.error(`[DEBUG] Building API search parameters...`);
      
      if (params.sku) {
        searchParams.sku = Array.isArray(params.sku) ? params.sku : [params.sku];
        console.error(`[DEBUG] Added SKU parameter:`, searchParams.sku);
      }
      
      // Note: The robotevents API might not support 'name' parameter
      // Let's try different parameter names
      if (params.name) {
        // Try multiple possible name parameters
        searchParams.name = params.name;
        console.error(`[DEBUG] Added name parameter: ${params.name}`);
      }
      
      if (params.start) {
        searchParams.start = params.start;
        console.error(`[DEBUG] Added start date: ${params.start}`);
      }
      
      if (params.end) {
        searchParams.end = params.end;
        console.error(`[DEBUG] Added end date: ${params.end}`);
      }
      
      if (params.season) {
        searchParams.season = Array.isArray(params.season) ? params.season : [params.season];
        console.error(`[DEBUG] Added season parameter:`, searchParams.season);
      }
      
      if (params.program) {
        if (typeof params.program === 'string') {
          const programMap: { [key: string]: number } = {
            'VRC': 1,
            'VIQC': 41, 
            'VEXU': 4,
          };
          const programId = programMap[params.program.toUpperCase()];
          if (programId) {
            searchParams.program = [programId];
            console.error(`[DEBUG] Mapped program "${params.program}" to ID: ${programId}`);
          } else {
            searchParams.program = [params.program];
            console.error(`[DEBUG] Using program parameter as-is: ${params.program}`);
          }
        } else {
          searchParams.program = [params.program];
          console.error(`[DEBUG] Added numeric program parameter: ${params.program}`);
        }
      }
      
      if (params.location) {
        // Try different location parameter names
        searchParams.city = params.location;
        searchParams.region = params.location;
        console.error(`[DEBUG] Added location parameter as city/region: ${params.location}`);
      }

      console.error(`[DEBUG] Final API search parameters:`, JSON.stringify(searchParams));
      
      // Retry the API call with timeout
      let events;
      let lastError;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.error(`[DEBUG] API call attempt ${attempt}/3...`);
          events = await this.executeWithTimeout(
            () => robotevents.events.search(searchParams), 
            30000 // 30s timeout
          );
          console.error(`[DEBUG] ✅ API call succeeded on attempt ${attempt}`);
          break;
        } catch (error) {
          lastError = error;
          console.error(`[DEBUG] ❌ API call attempt ${attempt} failed:`, error instanceof Error ? error.message : String(error));
          
          // Check if error suggests parameter issues
          const errorMsg = error instanceof Error ? error.message : String(error);
          if (errorMsg.toLowerCase().includes('parameter') || errorMsg.toLowerCase().includes('invalid')) {
            console.error(`[DEBUG] Parameter error detected, won't retry`);
            break;
          }
          
          if (attempt < 3) {
            console.error(`[DEBUG] Waiting 2s before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
        }
      }
      
      if (!events) {
        throw lastError || new Error('All API call attempts failed');
      }
      
      console.error(`[DEBUG] Direct API returned ${events.length} events`);
      
      if (events.length === 0) {
        console.error(`[DEBUG] No events found with current parameters`);
        console.error(`[DEBUG] ======= DIRECT API SEARCH FAILED (NO RESULTS) =======`);
        return { success: false };
      }
      
      console.error(`[DEBUG] Formatting ${events.length} events for response...`);
      const response = {
        content: [
          {
            type: "text", 
            text: `📊 Found ${events.length} events via direct API search:\n\n` +
                  events.map((event: any) => 
                    `**${event.name}** (${event.sku || event.id})\n` +
                    `Date: ${event.start ? new Date(event.start).toLocaleDateString() : 'N/A'} - ${event.end ? new Date(event.end).toLocaleDateString() : 'N/A'}\n` +
                    `Location: ${[event.location?.city, event.location?.region, event.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                    `Program: ${event.program?.name || 'N/A'}\n` +
                    `Season: ${event.season?.name || 'N/A'}\n` +
                    `Event ID: ${event.id}\n`
                  ).join('\n'),
          },
        ],
      };
      
      console.error(`[DEBUG] ✅ Direct API search completed successfully`);
      console.error(`[DEBUG] ======= DIRECT API SEARCH COMPLETED =======`);
      return { success: true, response };
      
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[ERROR] Direct API search failed:`, errorMsg);
      
      // Check if it's a Cloudflare protection error
      if (errorMsg.toLowerCase().includes('just a moment') || 
          errorMsg.toLowerCase().includes('cloudflare')) {
        console.error(`[ERROR] Cloudflare protection detected - API temporarily blocked`);
      }
      
      console.error(`[DEBUG] ======= DIRECT API SEARCH FAILED =======`);
      return { success: false };
    }
  }

  private async handleGetEventDetails(args: { event_id?: number; sku?: string }) {
    let event: any;
    
    if (args.event_id) {
      event = await robotevents.events.get(args.event_id);
      if (!event) {
        throw new Error(`Event with ID ${args.event_id} not found`);
      }
    } else if (args.sku) {
      const searchResult = await robotevents.events.search({ sku: [args.sku] });
      if (searchResult.length === 0) {
        throw new Error(`Event ${args.sku} not found`);
      }
      event = searchResult[0];
    } else {
      throw new Error("Either event_id or sku must be provided");
    }

    return {
      content: [
        {
          type: "text",
          text: `**${event.name}** (${event.sku})\n` +
                `Date: ${new Date(event.start).toLocaleDateString()} - ${new Date(event.end).toLocaleDateString()}\n` +
                `Program: ${event.program?.name || 'N/A'} (${event.program?.code || 'N/A'})\n` +
                `Season: ${event.season?.name || 'N/A'}\n` +
                `Location: ${[event.location?.city, event.location?.region, event.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
                `${event.location?.venue ? `Venue: ${event.location.venue}\n` : ''}` +
                `${event.location?.address_1 ? `Address: ${event.location.address_1}\n` : ''}` +
                `Divisions: ${event.divisions?.map((d: any) => d.name).join(', ') || 'N/A'}\n` +
                `Event ID: ${event.id}`,
        },
      ],
    };
  }

  private async handleGetTeamRankings(args: GetTeamRankingsParams) {
    try {
      if (args.event_id) {
        const event = await robotevents.events.get(args.event_id);
        if (!event) {
          throw new Error(`Event with ID ${args.event_id} not found`);
        }

        let rankingsText = `**${event.name} Rankings**\n`;
        rankingsText += `Event Date: ${event.start} - ${event.end}\n\n`;

        // Get rankings for each division
        for (const division of event.divisions) {
          try {
            const rankings = await event.rankings(division.id);
            rankingsText += `**Division ${division.name} Rankings:**\n`;
            
            const rankingsArray = rankings.array();
            if (rankingsArray.length === 0) {
              rankingsText += "No rankings available yet.\n\n";
              continue;
            }

            // Display top rankings (limit to first 20 to avoid too much text)
            const topRankings = rankingsArray.slice(0, 20);
            for (const rank of topRankings) {
              rankingsText += `${rank.rank}. Team ${rank.team.name} - WP:${rank.wp} AP:${rank.ap} SP:${rank.sp} (${rank.wins}-${rank.losses}-${rank.ties})\n`;
            }
            
            if (rankingsArray.length > 20) {
              rankingsText += `... and ${rankingsArray.length - 20} more teams\n`;
            }
            rankingsText += "\n";
          } catch (divisionError) {
            rankingsText += `Error getting rankings for ${division.name}: ${divisionError instanceof Error ? divisionError.message : String(divisionError)}\n\n`;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: rankingsText,
            },
          ],
        };
      } else if (args.team_id) {
        const team = await robotevents.teams.get(args.team_id);
        if (!team) {
          throw new Error(`Team with ID ${args.team_id} not found`);
        }

        const rankings = await team.rankings();
        
        let rankingsText = `**Team ${team.number} - ${team.team_name} Rankings History**\n\n`;
        
        const rankingsArray = rankings.array();
        if (rankingsArray.length === 0) {
          rankingsText += "No ranking history found for this team.\n";
        } else {
          // Group by event and show recent rankings
          const recentRankings = rankingsArray.slice(0, 10); // Show recent 10 rankings
          for (const rank of recentRankings) {
            rankingsText += `Event: ${rank.event.name}\n`;
            rankingsText += `Division: ${rank.division.name} | Rank: ${rank.rank}\n`;
            rankingsText += `Record: ${rank.wins}-${rank.losses}-${rank.ties} | WP:${rank.wp} AP:${rank.ap} SP:${rank.sp}\n\n`;
          }
          
          if (rankingsArray.length > 10) {
            rankingsText += `... and ${rankingsArray.length - 10} more ranking records\n`;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: rankingsText,
            },
          ],
        };
      } else {
        throw new Error("Either event_id or team_id must be provided");
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving rankings: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  private async handleGetSkillsScores(args: GetSkillsScoresParams) {
    try {
      if (args.event_id) {
        const event = await robotevents.events.get(args.event_id);
        if (!event) {
          throw new Error(`Event with ID ${args.event_id} not found`);
        }

        const skills = await event.skills();
        
        let skillsText = `**${event.name} Skills Scores**\n`;
        skillsText += `Event Date: ${event.start} - ${event.end}\n\n`;
        
        const skillsArray = skills.array();
        if (skillsArray.length === 0) {
          skillsText += "No skills scores available for this event yet.\n";
        } else {
          // Group by skill type
          const driverSkills = skillsArray.filter(s => s.type === 'driver').sort((a, b) => a.rank - b.rank);
          const programmingSkills = skillsArray.filter(s => s.type === 'programming').sort((a, b) => a.rank - b.rank);
          
          if (driverSkills.length > 0) {
            skillsText += `**Driver Skills Rankings:**\n`;
            const topDriver = driverSkills.slice(0, 15); // Show top 15
            for (const skill of topDriver) {
              skillsText += `${skill.rank}. Team ${skill.team.name} - ${skill.score} pts (${skill.attempts} attempts)\n`;
            }
            if (driverSkills.length > 15) {
              skillsText += `... and ${driverSkills.length - 15} more teams\n`;
            }
            skillsText += "\n";
          }
          
          if (programmingSkills.length > 0) {
            skillsText += `**Programming Skills Rankings:**\n`;
            const topProgramming = programmingSkills.slice(0, 15); // Show top 15  
            for (const skill of topProgramming) {
              skillsText += `${skill.rank}. Team ${skill.team.name} - ${skill.score} pts (${skill.attempts} attempts)\n`;
            }
            if (programmingSkills.length > 15) {
              skillsText += `... and ${programmingSkills.length - 15} more teams\n`;
            }
            skillsText += "\n";
          }
        }

        return {
          content: [
            {
              type: "text",
              text: skillsText,
            },
          ],
        };
      } else if (args.team_id) {
        const team = await robotevents.teams.get(args.team_id);
        if (!team) {
          throw new Error(`Team with ID ${args.team_id} not found`);
        }

        const skills = await team.skills();
        
        let skillsText = `**Team ${team.number} - ${team.team_name} Skills History**\n\n`;
        
        const skillsArray = skills.array();
        if (skillsArray.length === 0) {
          skillsText += "No skills scores found for this team.\n";
        } else {
          // Group by type and show recent scores
          const driverSkills = skillsArray.filter(s => s.type === 'driver').slice(0, 10);
          const programmingSkills = skillsArray.filter(s => s.type === 'programming').slice(0, 10);
          
          if (driverSkills.length > 0) {
            skillsText += `**Recent Driver Skills:**\n`;
            for (const skill of driverSkills) {
              skillsText += `Event: ${skill.event.name} | Rank: ${skill.rank} | Score: ${skill.score} pts (${skill.attempts} attempts)\n`;
            }
            skillsText += "\n";
          }
          
          if (programmingSkills.length > 0) {
            skillsText += `**Recent Programming Skills:**\n`;
            for (const skill of programmingSkills) {
              skillsText += `Event: ${skill.event.name} | Rank: ${skill.rank} | Score: ${skill.score} pts (${skill.attempts} attempts)\n`;
            }
            skillsText += "\n";
          }
          
          if (skillsArray.length > 20) {
            skillsText += `... and ${skillsArray.length - 20} more skill runs\n`;
          }
        }

        return {
          content: [
            {
              type: "text",
              text: skillsText,
            },
          ],
        };
      } else {
        throw new Error("Either event_id or team_id must be provided");
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error retrieving skills scores: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
      };
    }
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("VEX MCP server running on stdio");
  }
}

const server = new VEXMCPServer();
server.run().catch(console.error);