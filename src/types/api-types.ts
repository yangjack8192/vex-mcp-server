/**
 * API request and response parameter types for MCP tools
 */

export interface SearchTeamsParams {
  number?: string[];
  event?: number[];
  country?: string[];
  program?: number[];
  grade?: string[];
  registered?: boolean;
  team_name?: string;
  organization?: string;
}

export interface SearchEventsParams {
  sku?: string[];
  name?: string;
  level?: string[];
  eventTypes?: string[];
  start?: string;
  end?: string;
  season?: number[];
}

export interface GetTeamRankingsParams {
  team_id: number;
  event_id?: number;
  season?: number[];
}

export interface GetSkillsScoresParams {
  team_id?: number;
  event_id?: number;
  season?: number[];
  type?: 'driver' | 'programming';
}

export interface GetTeamInfoParams {
  team_id?: number;
  team_number?: string;
}

export interface GetTeamAwardsParams {
  team_id?: number;
  team_number?: string;
  season?: number[];
  event?: number[];
}

export interface GetEventDetailsParams {
  event_id?: number;
  sku?: string;
}

export interface GetEventAwardsParams {
  event_id: number;
  team?: number[];
  winner?: string[];
}