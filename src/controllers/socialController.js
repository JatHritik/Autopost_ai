const { PrismaClient } = require('@prisma/client');
const instagramService = require('../services/instagramService.js');
const linkedinService = require('../services/linkedinService.js');
const twitterService = require('../services/twitterService.js');
const logger = require('../utils/logger.js');

const prisma = new PrismaClient();

exports.connectInstagram = async (req, res) => {
  try {
    const { code } = req.body;
    
    const tokenData = await instagramService.exchangeCodeForToken(code);
    
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: req.userId,
          platform: 'INSTAGRAM'
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : null,
        accountId: tokenData.user_id,
        username: tokenData.username,
        isActive: true
      },
      create: {
        userId: req.userId,
        platform: 'INSTAGRAM',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at ? new Date(tokenData.expires_at * 1000) : null,
        accountId: tokenData.user_id,
        username: tokenData.username,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Instagram account connected successfully'
    });

  } catch (error) {
    logger.error('Instagram connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Instagram account'
    });
  }
};

exports.connectLinkedIn = async (req, res) => {
  try {
    const { code } = req.body;
    
    const tokenData = await linkedinService.exchangeCodeForToken(code);
    const profile = await linkedinService.getProfile(tokenData.access_token);
    
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: req.userId,
          platform: 'LINKEDIN'
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        accountId: profile.id,
        username: profile.localizedFirstName + ' ' + profile.localizedLastName,
        isActive: true
      },
      create: {
        userId: req.userId,
        platform: 'LINKEDIN',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
        accountId: profile.id,
        username: profile.localizedFirstName + ' ' + profile.localizedLastName,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'LinkedIn account connected successfully'
    });

  } catch (error) {
    logger.error('LinkedIn connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect LinkedIn account'
    });
  }
};

exports.connectTwitter = async (req, res) => {
  try {
    const { oauth_token, oauth_verifier } = req.body;
    
    const tokenData = await twitterService.exchangeCodeForToken(oauth_token, oauth_verifier);
    
    await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: req.userId,
          platform: 'TWITTER'
        }
      },
      update: {
        accessToken: tokenData.oauth_token,
        refreshToken: tokenData.oauth_token_secret,
        accountId: tokenData.user_id,
        username: tokenData.screen_name,
        isActive: true
      },
      create: {
        userId: req.userId,
        platform: 'TWITTER',
        accessToken: tokenData.oauth_token,
        refreshToken: tokenData.oauth_token_secret,
        accountId: tokenData.user_id,
        username: tokenData.screen_name,
        isActive: true
      }
    });

    res.json({
      success: true,
      message: 'Twitter account connected successfully'
    });

  } catch (error) {
    logger.error('Twitter connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to connect Twitter account'
    });
  }
};

exports.getSocialAccounts = async (req, res) => {
  try {
    const socialAccounts = await prisma.socialAccount.findMany({
      where: { userId: req.userId },
      select: {
        id: true,
        platform: true,
        username: true,
        isActive: true,
        createdAt: true
      }
    });

    res.json({
      success: true,
      data: { socialAccounts }
    });

  } catch (error) {
    logger.error('Get social accounts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch social accounts'
    });
  }
};

exports.disconnectAccount = async (req, res) => {
  try {
    const { platform } = req.params;

    await prisma.socialAccount.updateMany({
      where: {
        userId: req.userId,
        platform: platform.toUpperCase()
      },
      data: {
        isActive: false
      }
    });

    res.json({
      success: true,
      message: `${platform} account disconnected successfully`
    });

  } catch (error) {
    logger.error('Disconnect account error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect account'
    });
  }
};

exports.publishNow = async (req, res) => {
  try {
    const { content, platforms, mediaUrls = [] } = req.body;

    const results = [];
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { socialAccounts: true }
    });

    for (const platform of platforms) {
      try {
        const socialAccount = user.socialAccounts.find(
          acc => acc.platform === platform && acc.isActive
        );

        if (!socialAccount) {
          results.push({
            platform,
            success: false,
            error: 'Account not connected'
          });
          continue;
        }

        let postResult;
        
        switch (platform) {
          case 'INSTAGRAM':
            postResult = await instagramService.createPost({
              content,
              mediaUrls,
              accessToken: socialAccount.accessToken
            });
            break;
            
          case 'LINKEDIN':
            postResult = await linkedinService.createPost({
              content,
              mediaUrls,
              accessToken: socialAccount.accessToken
            });
            break;
            
          case 'TWITTER':
            postResult = await twitterService.createPost({
              content,
              mediaUrls,
              accessToken: socialAccount.accessToken
            });
            break;
        }

        results.push({
          platform,
          success: true,
          postId: postResult.id
        });

        // Save post record
        await prisma.post.create({
          data: {
            content,
            platform,
            postId: postResult.id,
            status: 'PUBLISHED',
            mediaUrls,
            postedAt: new Date(),
            userId: req.userId
          }
        });

      } catch (error) {
        results.push({
          platform,
          success: false,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: 'Posts published',
      data: { results }
    });

  } catch (error) {
    logger.error('Publish now error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to publish posts'
    });
  }
};