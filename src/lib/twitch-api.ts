import { config } from './config';

/**
 * Twitch API client for interacting with the Twitch Helix API
 */
export class TwitchAPI {
  private accessToken: string | null = null;
  private clientId: string = config.twitch.clientId;

  constructor(accessToken?: string) {
    if (accessToken) {
      this.accessToken = accessToken;
    }
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
  }

  /**
   * Get the headers required for Twitch API requests
   */
  private getHeaders() {
    const headers: Record<string, string> = {
      'Client-ID': this.clientId,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    return headers;
  }

  /**
   * Make a request to the Twitch API
   */
  private async request<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any
  ): Promise<T> {
    const url = `https://api.twitch.tv/helix/${endpoint}`;
    
    const options: RequestInit = {
      method,
      headers: this.getHeaders(),
    };

    if (body) {
      options.body = JSON.stringify(body);
      (options.headers as Record<string, string>)['Content-Type'] = 'application/json';
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Twitch API error: ${response.status} ${response.statusText} ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Get information about the authenticated user
   */
  async getUser() {
    if (!this.accessToken) {
      throw new Error('Access token required for this operation');
    }

    const response = await this.request<{
      data: Array<{
        id: string;
        login: string;
        display_name: string;
        profile_image_url: string;
        email?: string;
      }>;
    }>('users');

    return response.data[0];
  }

  /**
   * Get streams that the user follows
   */
  async getFollowedStreams() {
    if (!this.accessToken) {
      throw new Error('Access token required for this operation');
    }

    const user = await this.getUser();
    
    const response = await this.request<{
      data: Array<{
        id: string;
        user_id: string;
        user_login: string;
        user_name: string;
        game_id: string;
        game_name: string;
        type: string;
        title: string;
        viewer_count: number;
        started_at: string;
        language: string;
        thumbnail_url: string;
        tag_ids: string[];
        is_mature: boolean;
      }>;
    }>(`streams/followed?user_id=${user.id}`);

    return response.data;
  }

  /**
   * Get information about specific streams
   */
  async getStreams(userIds: string[]) {
    const userIdParams = userIds.map(id => `user_id=${id}`).join('&');
    
    const response = await this.request<{
      data: Array<{
        id: string;
        user_id: string;
        user_login: string;
        user_name: string;
        game_id: string;
        game_name: string;
        type: string;
        title: string;
        viewer_count: number;
        started_at: string;
        language: string;
        thumbnail_url: string;
        tag_ids: string[];
        is_mature: boolean;
      }>;
    }>(`streams?${userIdParams}`);

    return response.data;
  }

  /**
   * Get information about specific channels
   */
  async getChannels(userIds: string[]) {
    const userIdParams = userIds.map(id => `broadcaster_id=${id}`).join('&');
    
    const response = await this.request<{
      data: Array<{
        broadcaster_id: string;
        broadcaster_login: string;
        broadcaster_name: string;
        broadcaster_language: string;
        game_id: string;
        game_name: string;
        title: string;
      }>;
    }>(`channels?${userIdParams}`);

    return response.data;
  }

  /**
   * Get videos (VODs) for a specific user
   */
  async getUserVideos(userId: string, type: 'all' | 'archive' | 'highlight' | 'upload' = 'all') {
    const response = await this.request<{
      data: Array<{
        id: string;
        stream_id: string;
        user_id: string;
        user_login: string;
        user_name: string;
        title: string;
        description: string;
        created_at: string;
        published_at: string;
        url: string;
        thumbnail_url: string;
        viewable: string;
        view_count: number;
        language: string;
        type: string;
        duration: string;
      }>;
    }>(`videos?user_id=${userId}&type=${type}`);

    return response.data;
  }

  /**
   * Search for channels by name
   */
  async searchChannels(query: string, limit: number = 10) {
    const response = await this.request<{
      data: Array<{
        id: string;
        broadcaster_login: string;
        display_name: string;
        game_id: string;
        game_name: string;
        title: string;
        thumbnail_url: string;
        is_live: boolean;
        started_at: string;
        language: string;
        tags: string[];
      }>;
    }>(`search/channels?query=${encodeURIComponent(query)}&first=${limit}`);

    return response.data;
  }
}

// Create a singleton instance for client-side use
export const twitchApi = new TwitchAPI();