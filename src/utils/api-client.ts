/**
 * RobotEvents API client wrapper with common utilities
 */

import * as robotevents from "robotevents";
import https from 'https';
import http from 'http';

export class RobotEventsAPIClient {
  /**
   * Make a raw HTTP request to RobotEvents API
   */
  static makeRequest(
    url: string, 
    headers: Record<string, string> = {}
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https://') ? https : http;
      
      const requestHeaders = {
        'User-Agent': 'VEX-MCP-Server/1.0',
        ...headers
      };

      const req = protocol.get(url, { headers: requestHeaders }, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.setTimeout(30000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  /**
   * Search for teams using the robotevents package
   */
  static async searchTeams(params: any) {
    return await robotevents.teams.search(params);
  }

  /**
   * Search for events using the robotevents package
   */
  static async searchEvents(params: any) {
    return await robotevents.events.search(params);
  }

  /**
   * Get team by ID or number
   */
  static async getTeam(identifier: string | number, program?: string) {
    if (typeof identifier === 'number') {
      return await robotevents.teams.get(identifier);
    } else {
      return await robotevents.teams.get(identifier, program as any);
    }
  }

  /**
   * Get event by ID or SKU
   */
  static async getEvent(identifier: string | number) {
    return await robotevents.events.get(identifier);
  }
}