const axios = require('axios');
const logger = require('../utils/logger.js');

class InstagramService {
  constructor() {
    this.baseURL = 'https://graph.instagram.com';
    this.apiVersion = 'v18.0';
  }

  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://api.instagram.com/oauth/access_token', {
        client_id: process.env.INSTAGRAM_CLIENT_ID,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
        grant_type: 'authorization_code',
        redirect_uri: process.env.INSTAGRAM_REDIRECT_URI,
        code
      });

      // Exchange short-lived token for long-lived token
      const longLivedResponse = await axios.get(`${this.baseURL}/access_token`, {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: process.env.INSTAGRAM_CLIENT_SECRET,
          access_token: response.data.access_token
        }
      });

      return {
        access_token: longLivedResponse.data.access_token,
        expires_in: longLivedResponse.data.expires_in,
        user_id: response.data.user_id
      };

    } catch (error) {
      logger.error('Instagram token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange Instagram code for token');
    }
  }

  async createPost({ content, mediaUrls, accessToken }) {
    try {
      if (mediaUrls && mediaUrls.length > 0) {
        // Create media container
        const mediaResponse = await axios.post(`${this.baseURL}/me/media`, {
          image_url: mediaUrls[0], // Instagram Basic Display API supports single image
          caption: content,
          access_token: accessToken
        });

        // Publish media
        const publishResponse = await axios.post(`${this.baseURL}/me/media_publish`, {
          creation_id: mediaResponse.data.id,
          access_token: accessToken
        });

        return {
          id: publishResponse.data.id,
          success: true
        };
      } else {
        throw new Error('Instagram requires at least one image');
      }

    } catch (error) {
      logger.error('Instagram post creation error:', error.response?.data || error.message);
      throw new Error('Failed to create Instagram post');
    }
  }

  async getProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/me`, {
        params: {
          fields: 'id,username,account_type,media_count',
          access_token: accessToken
        }
      });

      return response.data;

    } catch (error) {
      logger.error('Instagram profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Instagram profile');
    }
  }

  async refreshToken(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/refresh_access_token`, {
        params: {
          grant_type: 'ig_refresh_token',
          access_token: accessToken
        }
      });

      return response.data;

    } catch (error) {
      logger.error('Instagram token refresh error:', error.response?.data || error.message);
      throw new Error('Failed to refresh Instagram token');
    }
  }
}

module.exports = new InstagramService();