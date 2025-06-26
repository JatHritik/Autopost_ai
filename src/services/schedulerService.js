const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const instagramService = require('./instagramService.js');
const linkedinService = require('./linkedinService.js');
const twitterService = require('./twitterService.js');
const logger = require('../utils/logger.js');

const prisma = new PrismaClient();

class SchedulerService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) return;
    
    logger.info('🕐 Starting scheduler service...');
    
    // Check for pending scheduled posts every minute
    this.mainJob = cron.schedule('* * * * *', async () => {
      await this.processPendingPosts();
    }, {
      scheduled: false
    });

    this.mainJob.start();
    this.isRunning = true;
    
    // Load existing scheduled posts on startup
    this.loadScheduledPosts();
  }

  stop() {
    if (!this.isRunning) return;
    
    logger.info('🛑 Stopping scheduler service...');
    
    if (this.mainJob) {
      this.mainJob.stop();
    }
    
    // Stop all individual scheduled jobs
    this.scheduledJobs.forEach(job => {
      if (job.task) job.task.stop();
    });
    
    this.scheduledJobs.clear();
    this.isRunning = false;
  }

  async loadScheduledPosts() {
    try {
      const pendingPosts = await prisma.scheduledPost.findMany({
        where: {
          status: 'PENDING',
          scheduledTime: {
            gt: new Date()
          }
        },
        include: {
          user: {
            include: {
              socialAccounts: true
            }
          }
        }
      });

      for (const post of pendingPosts) {
        await this.schedulePost(post);
      }

      logger.info(`📅 Loaded ${pendingPosts.length} scheduled posts`);
    } catch (error) {
      logger.error('Error loading scheduled posts:', error);
    }
  }

  async schedulePost(scheduledPost) {
    try {
      const scheduledTime = new Date(scheduledPost.scheduledTime);
      const now = new Date();

      if (scheduledTime <= now) {
        // Post should be published immediately
        await this.publishScheduledPost(scheduledPost.id);
        return;
      }

      // Create cron expression for the scheduled time
      const cronExpression = this.createCronExpression(scheduledTime);
      
      if (!cronExpression) {
        logger.error(`Invalid cron expression for post ${scheduledPost.id}`);
        return;
      }

      // Schedule the job
      const task = cron.schedule(cronExpression, async () => {
        await this.publishScheduledPost(scheduledPost.id);
        // Remove from scheduled jobs after execution
        this.scheduledJobs.delete(scheduledPost.id);
      }, {
        scheduled: true,
        timezone: 'UTC'
      });

      this.scheduledJobs.set(scheduledPost.id, {
        task,
        scheduledTime,
        cronExpression
      });

      // Update job ID in database
      await prisma.scheduledPost.update({
        where: { id: scheduledPost.id },
        data: { jobId: scheduledPost.id }
      });

      logger.info(`📅 Scheduled post ${scheduledPost.id} for ${scheduledTime.toISOString()}`);
    } catch (error) {
      logger.error(`Error scheduling post ${scheduledPost.id}:`, error);
    }
  }

  async cancelScheduledPost(postId) {
    try {
      const job = this.scheduledJobs.get(postId);
      if (job && job.task) {
        job.task.stop();
        this.scheduledJobs.delete(postId);
      }

      await prisma.scheduledPost.update({
        where: { id: postId },
        data: { 
          status: 'CANCELLED',
          jobId: null
        }
      });

      logger.info(`❌ Cancelled scheduled post ${postId}`);
    } catch (error) {
      logger.error(`Error cancelling scheduled post ${postId}:`, error);
    }
  }

  async processPendingPosts() {
    try {
      const now = new Date();
      const pendingPosts = await prisma.scheduledPost.findMany({
        where: {
          status: 'PENDING',
          scheduledTime: {
            lte: now
          }
        },
        include: {
          user: {
            include: {
              socialAccounts: true
            }
          }
        }
      });

      for (const post of pendingPosts) {
        await this.publishScheduledPost(post.id);
      }
    } catch (error) {
      logger.error('Error processing pending posts:', error);
    }
  }

  async publishScheduledPost(postId) {
    try {
      const scheduledPost = await prisma.scheduledPost.findUnique({
        where: { id: postId },
        include: {
          user: {
            include: {
              socialAccounts: true
            }
          }
        }
      });

      if (!scheduledPost) {
        logger.error(`Scheduled post ${postId} not found`);
        return;
      }

      if (scheduledPost.status !== 'PENDING') {
        logger.info(`Scheduled post ${postId} already processed (status: ${scheduledPost.status})`);
        return;
      }

      // Update status to processing
      await prisma.scheduledPost.update({
        where: { id: postId },
        data: { status: 'PROCESSING' }
      });

      const results = [];
      const { content, platforms, mediaUrls, user } = scheduledPost;

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
                accessToken: socialAccount.accessToken,
                tokenSecret: socialAccount.refreshToken
              });
              break;
          }

          results.push({
            platform,
            success: true,
            postId: postResult.id
          });

          // Save individual post record
          await prisma.post.create({
            data: {
              content,
              platform,
              postId: postResult.id,
              status: 'PUBLISHED',
              mediaUrls: mediaUrls || [],
              postedAt: new Date(),
              userId: user.id
            }
          });

        } catch (error) {
          logger.error(`Error publishing to ${platform}:`, error);
          results.push({
            platform,
            success: false,
            error: error.message
          });
        }
      }

      // Check if all platforms failed
      const allFailed = results.every(result => !result.success);
      const someSucceeded = results.some(result => result.success);

      if (allFailed) {
        // Retry logic
        const newRetryCount = scheduledPost.retryCount + 1;
        if (newRetryCount < scheduledPost.maxRetries) {
          await prisma.scheduledPost.update({
            where: { id: postId },
            data: {
              status: 'PENDING',
              retryCount: newRetryCount,
              scheduledTime: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
              errorMessage: results.map(r => `${r.platform}: ${r.error}`).join('; ')
            }
          });
          logger.info(`🔄 Retrying scheduled post ${postId} (attempt ${newRetryCount + 1})`);
        } else {
          await prisma.scheduledPost.update({
            where: { id: postId },
            data: {
              status: 'FAILED',
              errorMessage: results.map(r => `${r.platform}: ${r.error}`).join('; ')
            }
          });
          logger.error(`❌ Scheduled post ${postId} failed after ${scheduledPost.maxRetries} attempts`);
        }
      } else {
        await prisma.scheduledPost.update({
          where: { id: postId },
          data: {
            status: someSucceeded ? 'COMPLETED' : 'FAILED',
            errorMessage: results.filter(r => !r.success).map(r => `${r.platform}: ${r.error}`).join('; ') || null
          }
        });
        logger.info(`✅ Scheduled post ${postId} completed successfully`);
      }

      // Remove from scheduled jobs
      this.scheduledJobs.delete(postId);

    } catch (error) {
      logger.error(`Error publishing scheduled post ${postId}:`, error);
      
      await prisma.scheduledPost.update({
        where: { id: postId },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      });
    }
  }

  createCronExpression(date) {
    try {
      const minute = date.getUTCMinutes();
      const hour = date.getUTCHours();
      const day = date.getUTCDate();
      const month = date.getUTCMonth() + 1;
      const year = date.getUTCFullYear();

      // Create a one-time cron job: minute hour day month *
      return `${minute} ${hour} ${day} ${month} *`;
    } catch (error) {
      logger.error('Error creating cron expression:', error);
      return null;
    }
  }

  getJobStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: this.scheduledJobs.size,
      jobs: Array.from(this.scheduledJobs.entries()).map(([id, job]) => ({
        id,
        scheduledTime: job.scheduledTime,
        cronExpression: job.cronExpression
      }))
    };
  }
}

module.exports = new SchedulerService();
