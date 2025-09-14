/**
 * Team-related request handlers for MCP tools
 */

import * as robotevents from "robotevents";
import { SearchTeamsParams, GetTeamInfoParams } from "../types/index.js";
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
        searchParams.number = [args.number];
      }
      if (args.event) {
        searchParams.event = args.event;
      }
      if (args.country) {
        searchParams.country = args.country;
      }
      if (args.program) {
        if (typeof args.program === 'string') {
          const programMap: { [key: string]: number } = {
            'VRC': 1,
            'VIQC': 41,
            'VEXU': 4,
          };
          searchParams.program = [programMap[args.program.toUpperCase()] || args.program];
        } else {
          searchParams.program = [args.program];
        }
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
}