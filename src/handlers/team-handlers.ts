/**
 * Team-related request handlers for MCP tools
 */

import * as robotevents from "robotevents";
import { SearchTeamsParams, GetTeamInfoParams, GetTeamAwardsParams } from "../types/index.js";
import { createTextResponse, createErrorResponse } from "../utils/response-formatter.js";
import { RobotEventsAPIClient } from "../utils/api-client.js";

export class TeamHandlers {
  /**
   * Handles search-teams tool requests
   */
  static async handleSearchTeams(args: SearchTeamsParams) {
    try {
      // Build search parameters using correct TeamSearchOptions
      const searchParams: any = {};
      
      if (args.number) {
        searchParams.number = args.number;
      }
      if (args.event) {
        searchParams.event = args.event;
      }
      if (args.country) {
        searchParams.country = args.country;
      }
      if (args.program) {
        searchParams.program = args.program;
      }
      if (args.grade) {
        searchParams.grade = args.grade;
      }
      if (args.registered !== undefined) {
        searchParams.registered = args.registered;
      }

      let teams = await robotevents.teams.search(searchParams);
      
      // Client-side filtering for parameters not supported by API
      if (args.team_name) {
        const nameFilter = args.team_name.toLowerCase();
        teams = teams.filter((team: any) => 
          team.team_name?.toLowerCase().includes(nameFilter)
        );
      }
      
      if (args.organization) {
        const orgFilter = args.organization.toLowerCase();
        teams = teams.filter((team: any) => 
          team.organization?.toLowerCase().includes(orgFilter)
        );
      }
      
      const responseText = `Found ${teams.length} teams:\n\n` + 
        teams.map((team: any) => 
          `**${team.number}** - ${team.team_name}\n` +
          `Organization: ${team.organization}\n` +
          `Location: ${team.location?.city || 'N/A'}, ${team.location?.region || 'N/A'}, ${team.location?.country || 'N/A'}\n` +
          `Program: ${team.program?.name || 'N/A'}\n` +
          `Grade: ${team.grade || 'N/A'}\n` +
          `Registered: ${team.registered ? 'Yes' : 'No'}\n`
        ).join('\n');

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "searching teams");
    }
  }

  /**
   * Handles get-team-info tool requests
   */
  static async handleGetTeamInfo(args: GetTeamInfoParams) {
    try {
      let team: any;
      
      if (args.team_id) {
        team = await RobotEventsAPIClient.getTeam(args.team_id);
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

      const responseText = `**Team ${team.number}** - ${team.team_name}\n` +
        `${team.robot_name ? `Robot Name: ${team.robot_name}\n` : ''}` +
        `Organization: ${team.organization || 'N/A'}\n` +
        `Program: ${team.program?.name || 'N/A'} (${team.program?.code || 'N/A'})\n` +
        `Grade: ${team.grade || 'N/A'}\n` +
        `Location: ${[team.location?.city, team.location?.region, team.location?.country].filter(Boolean).join(', ') || 'N/A'}\n` +
        `${team.location?.venue ? `Venue: ${team.location.venue}\n` : ''}` +
        `Registered: ${team.registered ? 'Yes' : 'No'}\n` +
        `Team ID: ${team.id}`;

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "retrieving team information");
    }
  }

  /**
   * Handles get-team-awards tool requests
   */
  static async handleGetTeamAwards(args: GetTeamAwardsParams) {
    try {
      let teamId: number;
      let teamNumber: string;

      // Resolve team identifier
      if (args.team_id) {
        teamId = args.team_id;
        const team = await RobotEventsAPIClient.getTeam(teamId);
        if (!team) {
          throw new Error(`Team with ID ${teamId} not found`);
        }
        teamNumber = team.number;
      } else if (args.team_number) {
        teamNumber = args.team_number;
        const team = await RobotEventsAPIClient.getTeam(teamNumber);
        if (!team) {
          throw new Error(`Team ${teamNumber} not found`);
        }
        teamId = team.id;
      } else {
        throw new Error("Either team_id or team_number must be provided");
      }

      // Fetch awards with optional filters
      const options: any = {};
      if (args.season) {
        options.season = args.season;
      }
      if (args.event) {
        options.event = args.event;
      }

      const awardsCollection = await RobotEventsAPIClient.getTeamAwards(teamId, options);
      const awards = awardsCollection.array();

      if (awards.length === 0) {
        return createTextResponse(`No awards found for team ${teamNumber}.`);
      }

      // Format awards output
      let responseText = `**Awards for Team ${teamNumber}**\n`;
      responseText += `Total awards: ${awards.length}\n\n`;

      // Group by event for better organization
      const awardsByEvent = new Map<string, any[]>();

      for (const award of awards) {
        const eventName = award.event?.name || "Unknown Event";
        if (!awardsByEvent.has(eventName)) {
          awardsByEvent.set(eventName, []);
        }
        awardsByEvent.get(eventName)!.push(award);
      }

      // Sort events alphabetically
      const sortedEvents = Array.from(awardsByEvent.entries()).sort((a, b) => {
        return b[0].localeCompare(a[0]);
      });

      // Format output by event
      for (const [eventName, eventAwards] of sortedEvents) {
        responseText += `### ${eventName}\n`;
        for (const award of eventAwards) {
          const title = award.title || "Unknown Award";
          const qualifications = award.qualifications?.length > 0
            ? ` (${award.qualifications.join(", ")})`
            : "";

          responseText += `- **${title}**${qualifications}\n`;
        }
        responseText += `\n`;
      }

      return createTextResponse(responseText);
    } catch (error) {
      return createErrorResponse(error, "retrieving team awards");
    }
  }
}