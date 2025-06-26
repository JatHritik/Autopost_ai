const axios = require('axios');
const logger = require('../utils/logger');

class LinkedInService {
  constructor() {
    this.baseURL = 'https://api.linkedin.com/v2';
  }

  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: process.env.LINKEDIN_CLIENT_ID,
          client_secret: process.env.LINKEDIN_CLIENT_SECRET,
          redirect_uri: process.env.LINKEDIN_REDIRECT_URI
        },
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;

    } catch (error) {
      logger.error('LinkedIn token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange LinkedIn code for token');
    }
  }

  async getProfile(accessToken) {
    try {
      const response = await axios.get(`${this.baseURL}/people/~`, {
        params: {
          projection: '(id,localizedFirstName,localizedLastName,profilePicture(displayImage~:playableStreams))'
        },
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.data;

    } catch (error) {
      logger.error('LinkedIn profile fetch error:', error.response?.data || error.message);
      throw new Error('Failed to fetch LinkedIn profile');
    }
  }

  async createPost({ content, mediaUrls, accessToken }) {
    try {
      const profile = await this.getProfile(accessToken);
      
      let postData = {
        author: `urn:li:person:${profile.id}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content
            },
            shareMediaCategory: 'NONE'
          }
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
        }
      };

      // If media URLs are provided, upload them first
      if (mediaUrls && mediaUrls.length > 0) {
        const mediaAssets = [];
        
        for (const mediaUrl of mediaUrls) {
          const asset = await this.uploadMedia(mediaUrl, accessToken);
          mediaAssets.push({
            status: 'READY',
            description: {
              text: ''
            },
            media: asset.asset,
            title: {
              text: ''
            }
          });
        }

        postData.specificContent['com.linkedin.ugc.ShareContent'].shareMediaCategory = 'IMAGE';
        postData.specificContent['com.linkedin.ugc.ShareContent'].media = mediaAssets;
      }

      const response = await axios.post(`${this.baseURL}/ugcPosts`, postData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });

      return {
        id: response.headers['x-restli-id'] || response.data.id,
        success: true
      };

    } catch (error) {
      logger.error('LinkedIn post creation error:', error.response?.data || error.message);
      throw new Error('Failed to create LinkedIn post');
    }
  }

  async uploadMedia(mediaUrl, accessToken) {
    try {
      // Register upload
      const registerResponse = await axios.post(`${this.baseURL}/assets?action=registerUpload`, {
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: 'urn:li:person:me',
          serviceRelationships: [{
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent'
          }]
        }
      }, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      const uploadUrl = registerResponse.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
      const asset = registerResponse.data.value.asset;

      // Download media from URL
      const mediaResponse = await axios.get(mediaUrl, { responseType: 'arraybuffer' });
      
      // Upload media
      await axios.post(uploadUrl, mediaResponse.data, {
        headers: {
          'Content-Type': 'application/octet-stream'
        }
      });

      return { asset };

    } catch (error) {
      logger.error('LinkedIn media upload error:', error.response?.data || error.message);
      throw new Error('Failed to upload media to LinkedIn');
    }
  }
}

module.exports = new LinkedInService();
