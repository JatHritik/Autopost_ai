const axios = require('axios');
const crypto = require('crypto');
const logger = require('../utils/logger.js');

class TwitterService {
  constructor() {
    this.baseURL = 'https://api.twitter.com';
    this.apiKey = process.env.TWITTER_API_KEY;
    this.apiSecret = process.env.TWITTER_API_SECRET;
  }

  // OAuth 1.0a signature generation
  generateSignature(method, url, params, tokenSecret = '') {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${encodeURIComponent(params[key])}`)
      .join('&');

    const signatureBaseString = `${method}&${encodeURIComponent(url)}&${encodeURIComponent(sortedParams)}`;
    const signingKey = `${encodeURIComponent(this.apiSecret)}&${encodeURIComponent(tokenSecret)}`;
    
    return crypto
      .createHmac('sha1', signingKey)
      .update(signatureBaseString)
      .digest('base64');
  }

  // Generate OAuth header
  generateAuthHeader(method, url, params, accessToken = '', tokenSecret = '') {
    const oauthParams = {
      oauth_consumer_key: this.apiKey,
      oauth_nonce: crypto.randomBytes(16).toString('hex'),
      oauth_signature_method: 'HMAC-SHA1',
      oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
      oauth_version: '1.0',
      ...(accessToken && { oauth_token: accessToken })
    };

    const allParams = { ...oauthParams, ...params };
    const signature = this.generateSignature(method, url, allParams, tokenSecret);
    
    oauthParams.oauth_signature = signature;

    const authString = Object.keys(oauthParams)
      .sort()
      .map(key => `${key}="${encodeURIComponent(oauthParams[key])}"`)
      .join(', ');

    return `OAuth ${authString}`;
  }

  async exchangeCodeForToken(oauthToken, oauthVerifier) {
    try {
      const url = `${this.baseURL}/oauth/access_token`;
      const params = {
        oauth_verifier: oauthVerifier
      };

      const authHeader = this.generateAuthHeader('POST', url, params, oauthToken);

      const response = await axios.post(url, null, {
        params,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      // Parse response data
      const responseParams = new URLSearchParams(response.data);
      return {
        oauth_token: responseParams.get('oauth_token'),
        oauth_token_secret: responseParams.get('oauth_token_secret'),
        user_id: responseParams.get('user_id'),
        screen_name: responseParams.get('screen_name')
      };

    } catch (error) {
      logger.error('Twitter token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange Twitter code for token');
    }
  }

  async createPost({ content, mediaUrls, accessToken, tokenSecret }) {
    try {
      let mediaIds = [];

      // Upload media if provided
      if (mediaUrls && mediaUrls.length > 0) {
        for (const mediaUrl of mediaUrls) {
          const mediaId = await this.uploadMedia(mediaUrl, accessToken, tokenSecret);
          mediaIds.push(mediaId);
        }
      }

      // Create tweet
      const url = `${this.baseURL}/1.1/statuses/update.json`;
      const params = {
        status: content,
        ...(mediaIds.length > 0 && { media_ids: mediaIds.join(',') })
      };

      const authHeader = this.generateAuthHeader('POST', url, params, accessToken, tokenSecret);

      const response = await axios.post(url, null, {
        params,
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return {
        id: response.data.id_str,
        success: true
      };

    } catch (error) {
      logger.error('Twitter post creation error:', error.response?.data || error.message);
      throw new Error('Failed to create Twitter post');
    }
  }

  async uploadMedia(mediaUrl, accessToken, tokenSecret) {
    try {
      // Download media
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      const mediaBuffer = Buffer.from(mediaResponse.data);

      // Upload media to Twitter
      const url = `${this.baseURL}/1.1/media/upload.json`;
      const params = {};

      const authHeader = this.generateAuthHeader('POST', url, params, accessToken, tokenSecret);

      const uploadResponse = await axios.post(url, {
        media_data: mediaBuffer.toString('base64')
      }, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return uploadResponse.data.media_id_string;

    } catch (error) {
      logger.error('Twitter media upload error:', error.response?.data || error.message);
      throw new Error('Failed to upload media to Twitter');
    }
  }

  async getProfile(accessToken, tokenSecret) {
    try {
      const url = `${this.baseURL}/1.1/account/verify_credentials.json`;
      const params = {};

      const authHeader = this.generateAuthHeader('GET', url, params, accessToken, tokenSecret);

      const response = await axios.get(url, {
        headers: {
          'Authorization': authHeader
        }
      });

      return response.data;

    } catch (error) {
      logger.error('Twitter profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch Twitter profile');
    }
  }
}

module.exports = new TwitterService();