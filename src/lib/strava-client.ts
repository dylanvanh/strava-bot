import axios from "axios";
import { env } from "../config/env.js";
import ApiClient from "./api-client.js";

export interface StravaActivitySummary {
  id: number;
  name: string;
  type: string;
  start_date: string;
  distance: number;
  private: boolean;
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
}

/**
 * Strava API Client for handling authentication and API requests
 */
class StravaClient extends ApiClient {
  private clientId: string;
  private clientSecret: string;
  private refreshToken: string;
  private accessToken: string = "";
  private tokenExpiresAt: number = 0;

  constructor() {
    super("https://www.strava.com/api/v3", {
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.clientId = env.STRAVA_CLIENT_ID;
    this.clientSecret = env.STRAVA_CLIENT_SECRET;
    this.refreshToken = env.STRAVA_INITIAL_REFRESH_TOKEN;
    this.tokenExpiresAt = 0;

    this.api.interceptors.request.use(async (config) => {
      if (this.isTokenExpired()) {
        await this.refreshAccessToken();
      }
      config.headers["Authorization"] = `Bearer ${this.accessToken}`;
      return config;
    });

    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            await this.refreshAccessToken();
            originalRequest.headers["Authorization"] =
              `Bearer ${this.accessToken}`;
            return this.api(originalRequest);
          } catch (refreshError) {
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Check if the current access token is expired or about to expire
   * Consider token expired if it expires in less than 5 minutes
   */
  private isTokenExpired(): boolean {
    const fiveMinutesBufferTime = 5 * 60;
    const currentTime = Math.floor(Date.now() / 1000);
    return this.tokenExpiresAt - currentTime < fiveMinutesBufferTime;
  }

  /**
   * Refresh the Strava access token using the refresh token
   */
  public async refreshAccessToken(): Promise<void> {
    try {
      const tempAxios = axios.create({
        baseURL: "",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const response = await tempAxios.post(
        "https://www.strava.com/oauth/token",
        {
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: "refresh_token",
        },
      );

      const data = response.data as TokenResponse;

      this.accessToken = data.access_token;
      this.refreshToken = data.refresh_token;
      this.tokenExpiresAt = data.expires_at;
    } catch (error) {
      console.error("Error refreshing Strava token:", error);
      throw error;
    }
  }

  async getAllActivities(
    page = 1,
    perPage = 5,
  ): Promise<StravaActivitySummary[]> {
    return this.get<StravaActivitySummary[]>("/athlete/activities", {
      page,
      per_page: perPage,
    });
  }

  // The strava api doesnt support deleting, so have to update to private
  async updateActivity(
    activityId: number,
    updates: {
      hide_from_home?: boolean;
      name?: string;
      description?: string;
      commute?: boolean;
      trainer?: boolean;
      sport_type?: string;
      gear_id?: string;
    },
  ): Promise<StravaActivitySummary> {
    try {
      console.log(
        `Making PUT request to /activities/${activityId} with:`,
        JSON.stringify(updates, null, 2),
      );
      const result = await this.put<StravaActivitySummary>(
        `/activities/${activityId}`,
        updates,
      );
      console.log(`Update successful for activity ${activityId}`);
      return result;
    } catch (error: any) {
      console.error(`Error updating activity ${activityId}:`, {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
      throw error;
    }
  }
}

export default StravaClient;
