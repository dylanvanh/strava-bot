import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

abstract class ApiClient {
  protected api: AxiosInstance;

  protected constructor(baseURL: string, config: AxiosRequestConfig = {}) {
    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        "Content-Type": "application/json",
      },
      ...config,
    });
  }

  protected updateBaseUrl(newBaseUrl: string): void {
    this.api.defaults.baseURL = newBaseUrl;
  }

  protected async get<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    try {
      const response = await this.api.get<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`API error (GET ${endpoint}):`, error);
      throw error;
    }
  }

  protected async put<T>(
    endpoint: string,
    data: Record<string, unknown> = {},
  ): Promise<T> {
    try {
      const response = await this.api.put<T>(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`API error (PUT ${endpoint}):`, error);
      throw error;
    }
  }

  protected async delete<T>(
    endpoint: string,
    params: Record<string, unknown> = {},
  ): Promise<T> {
    try {
      const response = await this.api.delete<T>(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error(`API error (DELETE ${endpoint}):`, error);
      throw error;
    }
  }
}

export default ApiClient;
