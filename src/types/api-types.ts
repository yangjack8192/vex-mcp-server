/**
 * API request and response parameter types for MCP tools
 */

export interface SearchTeamsParams {
  number?: string;
  team_name?: string;
  organization?: string;
  location?: string;
  program?: number | string;
  grade?: string;
  registered?: boolean;
}

export interface SearchEventsParams {
  sku?: string;
  name?: string;
  start?: string;
  end?: string;
  season?: number;
  program?: number | string;
  location?: string;
}

export interface GetTeamRankingsParams {
  team_id: number;
  event_id?: number;
  season?: number;
}

export interface GetSkillsScoresParams {
  team_id?: number;
  event_id?: number;
  season?: number;
  type?: 'driver' | 'programming';
}

export interface GetTeamInfoParams {
  team_id?: number;
  team_number?: string;
}

export interface GetEventDetailsParams {
  event_id?: number;
  sku?: string;
}