/**
 * Ranking and skills-related request handlers for MCP tools
 */

import * as robotevents from "robotevents";
import { GetTeamRankingsParams, GetSkillsScoresParams } from "../types/index.js";
import { createTextResponse, createErrorResponse } from "../utils/response-formatter.js";
import { RobotEventsAPIClient } from "../utils/api-client.js";

export class RankingHandlers {
  /**
   * Handles get-team-rankings tool requests
   */
  static async handleGetTeamRankings(args: GetTeamRankingsParams) {
    try {
      if (args.event_id) {
        const event = await RobotEventsAPIClient.getEvent(args.event_id);
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

        return createTextResponse(rankingsText);
      } else if (args.team_id) {
        const team = await RobotEventsAPIClient.getTeam(args.team_id);
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

        return createTextResponse(rankingsText);
      } else {
        throw new Error("Either event_id or team_id must be provided");
      }
    } catch (error) {
      return createErrorResponse(error, "retrieving rankings");
    }
  }

  /**
   * Handles get-skills-scores tool requests
   */
  static async handleGetSkillsScores(args: GetSkillsScoresParams) {
    try {
      if (args.event_id) {
        const event = await RobotEventsAPIClient.getEvent(args.event_id);
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

        return createTextResponse(skillsText);
      } else if (args.team_id) {
        const team = await RobotEventsAPIClient.getTeam(args.team_id);
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

        return createTextResponse(skillsText);
      } else {
        throw new Error("Either event_id or team_id must be provided");
      }
    } catch (error) {
      return createErrorResponse(error, "retrieving skills scores");
    }
  }
}