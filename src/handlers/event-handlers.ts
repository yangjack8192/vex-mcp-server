/**
 * Event-related request handlers for MCP tools
 */

import * as robotevents from "robotevents";
import { SearchEventsParams, GetEventDetailsParams } from "../types/index.js";
import { createTextResponse, createErrorResponse } from "../utils/response-formatter.js";
import { RobotEventsAPIClient } from "../utils/api-client.js";

export class EventHandlers {
  /**
   * Handles search-events tool requests with simplified search logic
   */
  static async handleSearchEvents(args?: SearchEventsParams) {
    try {
      const params = args || {};
      
      // Build search parameters for the robotevents API using correct EventSearchOptions
      const searchParams: any = {};
      
      if (params.sku) {
        searchParams.sku = Array.isArray(params.sku) ? params.sku : [params.sku];
      }
      if (params.region) {
        searchParams.region = params.region;
      }
      if (params.level) {
        searchParams.level = params.level;
      }
      if (params.eventTypes) {
        searchParams.eventTypes = params.eventTypes;
      }
      if (params.start) {
        searchParams.start = params.start;
      }
      if (params.end) {
        searchParams.end = params.end;
      }
      if (params.season) {
        searchParams.season = [params.season];
      }
      if (params.program) {
        // Note: program parameter doesn't exist in EventSearchOptions
        // We'll need to filter by program after getting results
      }

      let events = await robotevents.events.search(searchParams);
      
      // Client-side filtering for parameters not supported by API
      if (params.name) {
        const nameFilter = params.name.toLowerCase();
        events = events.filter((event: any) => 
          event.name.toLowerCase().includes(nameFilter)
        );
      }
      
      if (params.program) {
        const programFilter = typeof params.program === 'string' 
          ? params.program.toUpperCase() 
          : params.program;
        
        if (typeof programFilter === 'string') {
          events = events.filter((event: any) => 
            event.program?.code === programFilter
          );
        } else {
          events = events.filter((event: any) => 
            event.program?.id === programFilter
          );
        }
      }
      
      if (events.length === 0) {
        return createTextResponse(
          `No events found matching your criteria.\n\n` +
          `Search parameters: ${JSON.stringify(params, null, 2)}\n\n` +
          `Try adjusting your search terms or removing some filters.`
        );
      }

      // Limit to first 20 events to avoid overly long responses
      const displayEvents = events.slice(0, 20);
      
      let responseText = `Found ${events.length} events`;
      if (events.length > 20) {
        responseText += ` (showing first 20)`;
      }
      responseText += `:\n\n`;
      
      responseText += displayEvents.map((event: any) => {
        const startDate = new Date(event.start).toLocaleDateString();
        const endDate = new Date(event.end).toLocaleDateString();
        const location = [event.location?.city, event.location?.region, event.location?.country]
          .filter(Boolean)
          .join(', ') || 'Location TBD';
        
        return `**${event.name}** (${event.sku})\n` +
          `Date: ${startDate} - ${endDate}\n` +
          `Location: ${location}\n` +
          `Program: ${event.program?.name || 'N/A'}\n` +
          `Season: ${event.season?.name || 'N/A'}\n` +
          `Event ID: ${event.id}\n`;
      }).join('\n');

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "searching events");
    }
  }

  /**
   * Handles get-event-details tool requests
   */
  static async handleGetEventDetails(args: GetEventDetailsParams) {
    try {
      let event: any;
      
      if (args.event_id) {
        event = await RobotEventsAPIClient.getEvent(args.event_id);
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

      const startDate = new Date(event.start).toLocaleDateString();
      const endDate = new Date(event.end).toLocaleDateString();
      const location = [event.location?.city, event.location?.region, event.location?.country]
        .filter(Boolean)
        .join(', ') || 'N/A';

      const responseText = `**${event.name}** (${event.sku})\n` +
        `Date: ${startDate} - ${endDate}\n` +
        `Program: ${event.program?.name || 'N/A'} (${event.program?.code || 'N/A'})\n` +
        `Season: ${event.season?.name || 'N/A'}\n` +
        `Location: ${location}\n` +
        `${event.location?.venue ? `Venue: ${event.location.venue}\n` : ''}` +
        `${event.location?.address_1 ? `Address: ${event.location.address_1}\n` : ''}` +
        `Divisions: ${event.divisions?.map((d: any) => d.name).join(', ') || 'N/A'}\n` +
        `Event ID: ${event.id}`;

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "retrieving event details");
    }
  }
}