/**
 * Match analysis handlers for VEX MCP Server
 */

import { RobotEventsAPIClient } from "../utils/api-client.js";

interface AnalyzeMatchOpponentsParams {
  team_id?: number;
  team_number?: string;
  event_id?: number;
  event_sku?: string;
}

interface TeamAwardInfo {
  teamId: number;
  teamNumber: string;
  teamName: string;
  awards: string[];
}

interface MatchAnalysis {
  matchName: string;
  matchId: number;
  scheduled: string | null;
  teammates: TeamAwardInfo[];
  opponents: TeamAwardInfo[];
  yourTeam: {
    teamId: number;
    teamNumber: string;
  };
}

export class MatchHandlers {
  /**
   * Format awards for display
   */
  private static formatAwards(awards: any[], limit: number = 10): string[] {
    const formattedAwards: string[] = [];

    for (const award of awards.slice(0, limit)) {
      const title = award.title || "Unknown Award";
      const eventName = award.event?.name || "";
      const season = award.season?.name || "";

      if (eventName) {
        formattedAwards.push(`${title} (${eventName}${season ? `, ${season}` : ""})`);
      } else {
        formattedAwards.push(title);
      }
    }

    return formattedAwards;
  }

  /**
   * Extract team info from match alliance
   */
  private static extractTeamInfo(team: any): { id: number; number: string; name: string } {
    const fullName = team.team?.name || "";
    const teamNumber = fullName.split(" ")[0];
    const teamName = fullName.substring(teamNumber.length).trim();

    return {
      id: team.team?.id || 0,
      number: teamNumber,
      name: teamName,
    };
  }

  /**
   * Handle analyze-match-opponents tool call
   */
  static async handleAnalyzeMatchOpponents(
    params: AnalyzeMatchOpponentsParams
  ): Promise<any> {
    try {
      // Resolve team_id
      let teamId: number;
      let teamNumber: string;

      if (params.team_id) {
        teamId = params.team_id;
        const team = await RobotEventsAPIClient.getTeam(teamId);
        if (!team) {
          throw new Error(`Team with ID ${teamId} not found`);
        }
        teamNumber = team.number;
      } else if (params.team_number) {
        teamNumber = params.team_number;
        const team = await RobotEventsAPIClient.getTeam(teamNumber);
        if (!team) {
          throw new Error(`Team ${teamNumber} not found`);
        }
        teamId = team.id;
      } else {
        throw new Error("Either team_id or team_number is required");
      }

      // Resolve event_id
      let eventId: number;
      let eventName: string;

      if (params.event_id) {
        eventId = params.event_id;
        const event = await RobotEventsAPIClient.getEvent(eventId);
        if (!event) {
          throw new Error(`Event with ID ${eventId} not found`);
        }
        eventName = event.name;
      } else if (params.event_sku) {
        const event = await RobotEventsAPIClient.getEvent(params.event_sku);
        if (!event) {
          throw new Error(`Event ${params.event_sku} not found`);
        }
        eventId = event.id;
        eventName = event.name;
      } else {
        throw new Error("Either event_id or event_sku is required");
      }

      // Fetch all matches for this team at this event
      const matchesCollection = await RobotEventsAPIClient.getTeamMatches(teamId, {
        event: [eventId],
      });

      const matches = matchesCollection.array();

      if (!matches || matches.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No matches found for team ${teamNumber} at event ${eventName}`,
            },
          ],
        };
      }

      // Collect all unique team IDs from matches
      const teamIds = new Set<number>();
      for (const match of matches) {
        for (const alliance of match.alliances || []) {
          for (const team of alliance.teams || []) {
            const info = this.extractTeamInfo(team);
            if (info.id && !team.sitting) {
              teamIds.add(info.id);
            }
          }
        }
      }

      // Fetch awards for all teams
      const teamAwardInfo = new Map<number, TeamAwardInfo>();

      for (const tid of teamIds) {
        try {
          const awardsCollection = await RobotEventsAPIClient.getTeamAwards(tid);
          const awards = awardsCollection.array();
          const teamInfo = await RobotEventsAPIClient.getTeam(tid);

          if (teamInfo) {
            const formattedAwards = this.formatAwards(awards);
            teamAwardInfo.set(tid, {
              teamId: tid,
              teamNumber: teamInfo.number,
              teamName: teamInfo.team_name || "",
              awards: formattedAwards,
            });
          }
        } catch (error) {
          // If we can't fetch awards for a team, set empty awards
          console.error(`Failed to fetch awards for team ${tid}:`, error);
          const teamInfo = await RobotEventsAPIClient.getTeam(tid);
          if (teamInfo) {
            teamAwardInfo.set(tid, {
              teamId: tid,
              teamNumber: teamInfo.number,
              teamName: teamInfo.team_name || "",
              awards: [],
            });
          }
        }
      }

      // Analyze each match
      const matchAnalyses: MatchAnalysis[] = [];

      for (const match of matches) {
        // Find which alliance the target team is on
        const yourAlliance = match.alliances?.find((alliance: any) =>
          alliance.teams?.some((t: any) => {
            const info = this.extractTeamInfo(t);
            return info.number === teamNumber && !t.sitting;
          })
        );

        if (!yourAlliance) continue;

        const opponentAlliance = match.alliances?.find(
          (alliance: any) => alliance !== yourAlliance
        );

        // Extract teammates (excluding your team and sitting teams)
        const teammates: TeamAwardInfo[] = [];
        for (const team of yourAlliance.teams || []) {
          const info = this.extractTeamInfo(team);
          if (info.number !== teamNumber && !team.sitting) {
            const awardData = teamAwardInfo.get(info.id);
            if (awardData) {
              teammates.push(awardData);
            }
          }
        }

        // Extract opponents (excluding sitting teams)
        const opponents: TeamAwardInfo[] = [];
        for (const team of opponentAlliance?.teams || []) {
          const info = this.extractTeamInfo(team);
          if (!team.sitting) {
            const awardData = teamAwardInfo.get(info.id);
            if (awardData) {
              opponents.push(awardData);
            }
          }
        }

        matchAnalyses.push({
          matchName: match.name || `Match ${match.id}`,
          matchId: match.id,
          scheduled: match.scheduled || null,
          teammates,
          opponents,
          yourTeam: {
            teamId,
            teamNumber,
          },
        });
      }

      // Format output
      const output = this.formatMatchAnalysis(
        teamNumber,
        eventName,
        matchAnalyses
      );

      return {
        content: [
          {
            type: "text",
            text: output,
          },
        ],
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Format match analysis for display
   */
  private static formatMatchAnalysis(
    teamNumber: string,
    eventName: string,
    analyses: MatchAnalysis[]
  ): string {
    let output = `# Match Analysis for Team ${teamNumber} at ${eventName}\n\n`;
    output += `Total matches: ${analyses.length}\n\n`;
    output += `This analysis shows recent awards won by each team to help you understand their competitive history.\n\n`;
    output += `---\n\n`;

    for (const analysis of analyses) {
      output += `## ${analysis.matchName}\n`;
      if (analysis.scheduled) {
        output += `**Time**: ${new Date(analysis.scheduled).toLocaleString()}\n`;
      }
      output += `\n`;

      // Your alliance
      output += `### Your Alliance (${analysis.yourTeam.teamNumber})\n`;
      if (analysis.teammates.length > 0) {
        output += `**Teammates**:\n`;
        for (const teammate of analysis.teammates) {
          output += `- **${teammate.teamNumber}** ${teammate.teamName}\n`;
          if (teammate.awards.length > 0) {
            output += `  - Recent awards: ${teammate.awards.join("; ")}\n`;
          } else {
            output += `  - No recent awards found\n`;
          }
        }
      } else {
        output += `*No teammates (solo)*\n`;
      }
      output += `\n`;

      // Opponent alliance
      output += `### Opponent Alliance\n`;
      if (analysis.opponents.length > 0) {
        for (const opponent of analysis.opponents) {
          output += `- **${opponent.teamNumber}** ${opponent.teamName}\n`;
          if (opponent.awards.length > 0) {
            output += `  - Recent awards: ${opponent.awards.join("; ")}\n`;
          } else {
            output += `  - No recent awards found\n`;
          }
        }
      } else {
        output += `*No opponents found*\n`;
      }

      output += `\n---\n\n`;
    }

    return output;
  }
}
