/**
 * RobotEvents API authentication setup
 */

import * as robotevents from "robotevents";

export class RobotEventsAuth {
  private static instance: RobotEventsAuth;
  private isAuthenticated: boolean = false;

  private constructor() {}

  public static getInstance(): RobotEventsAuth {
    if (!RobotEventsAuth.instance) {
      RobotEventsAuth.instance = new RobotEventsAuth();
    }
    return RobotEventsAuth.instance;
  }

  public setupAuthentication(): void {
    const token = process.env.ROBOTEVENTS_TOKEN;
    if (!token) {
      console.error("Warning: ROBOTEVENTS_TOKEN environment variable not set");
      console.error("Some API calls may fail without authentication");
      return;
    }

    try {
      robotevents.authentication.setBearer(token);
      this.isAuthenticated = true;
      console.log("RobotEvents API authentication configured successfully");
    } catch (error) {
      console.error("Failed to set RobotEvents authentication:", error);
    }
  }

  public isAuthConfigured(): boolean {
    return this.isAuthenticated;
  }

  public getAuthStatus(): string {
    return this.isAuthenticated 
      ? "✅ RobotEvents API authenticated"
      : "⚠️ RobotEvents API not authenticated - some features may be limited";
  }
}