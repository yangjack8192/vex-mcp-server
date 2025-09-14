export interface VEXTeam {
  id: number;
  number: string;
  team_name: string;
  robot_name?: string;
  organization: string;
  location: {
    venue?: string;
    address_1?: string;
    address_2?: string;
    city: string;
    region: string;
    postcode?: string;
    country: string;
  };
  registered: boolean;
  program: {
    id: number;
    name: string;
    code: string;
  };
  grade: string;
}

export interface VEXEvent {
  id: number;
  sku: string;
  name: string;
  start: string;
  end: string;
  season: {
    id: number;
    name: string;
    program: {
      id: number;
      name: string;
      code: string;
    };
  };
  program: {
    id: number;
    name: string;
    code: string;
  };
  location: {
    venue?: string;
    address_1?: string;
    address_2?: string;
    city: string;
    region: string;
    postcode?: string;
    country: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };
  divisions: Array<{
    id: number;
    name: string;
    order: number;
  }>;
}

export interface VEXRanking {
  team: {
    id: number;
    name: string;
  };
  rank: number;
  wins: number;
  losses: number;
  ties: number;
  wp: number;
  ap: number;
  sp: number;
  high_score: number;
  average_points: number;
  total_points: number;
}

export interface VEXSkillsRun {
  id: number;
  team: {
    id: number;
    name: string;
  };
  type: 'driver' | 'programming';
  season: {
    id: number;
    name: string;
  };
  event: {
    id: number;
    name: string;
    code?: string;
  };
  division: {
    id: number;
    name: string;
  };
  rank: number;
  score: number;
  attempts: number;
}

export interface VEXMatch {
  id: number;
  name: string;
  matchnum: number;
  scheduled: string;
  started?: string;
  field: string;
  scored: boolean;
  alliances: Array<{
    color: 'red' | 'blue';
    score: number;
    teams: Array<{
      team: {
        id: number;
        name: string;
      };
      sitting: boolean;
    }>;
  }>;
}

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