const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const aiService = require('../services/aiServices.js');
const schedulerService = require('../services/schedulerService.js');
const logger = require('../utils/logger.js');



exports.generateContent = async (req, res) => {
  try {
    const { prompt, platform, tone = 'professional', length = 'medium' } = req.body;

    const generatedContent = await aiService.generateContent({
      prompt,
      platform,
      tone,
      length
    });

    res.json({
      success: true,
      data: { content: generatedContent }
    });

  } catch (error) {
    logger.error('Content generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate content'
    });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { content, platform, mediaUrls = [], hashtags = [] } = req.body;

    const post = await prisma.post.create({
      data: {
        content,
        platform,
        mediaUrls,
        hashtags,
        userId: req.userId
      }
    });

    res.status(201).json({
      success: true,
      message: 'Post created successfully',
      data: { post }
    });

  } catch (error) {
    logger.error('Create post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create post'
    });
  }
};

exports.schedulePost = async (req, res) => {
  try {
    const { 
      content, 
      platforms, 
      scheduledTime, 
      mediaUrls = [], 
      hashtags = [] 
    } = req.body;

    const scheduledPost = await prisma.scheduledPost.create({
      data: {
        content,
        platforms,
        scheduledTime: new Date(scheduledTime),
        mediaUrls,
        hashtags,
        userId: req.userId
      }
    });

    // Schedule the job
    await schedulerService.schedulePost(scheduledPost);

    res.status(201).json({
      success: true,
      message: 'Post scheduled successfully',
      data: { scheduledPost }
    });

  } catch (error) {
    logger.error('Schedule post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule post'
    });
  }
};

exports.getScheduledPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.userId,
      ...(status && { status })
    };

    const [scheduledPosts, total] = await Promise.all([
      prisma.scheduledPost.findMany({
        where,
        orderBy: { scheduledTime: 'asc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.scheduledPost.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        scheduledPosts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get scheduled posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scheduled posts'
    });
  }
};

 exports.editScheduledPost = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, platforms, scheduledTime, mediaUrls = [], hashtags = [] } = req.body;

    const scheduledPost = await prisma.scheduledPost.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!scheduledPost) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    // Update the scheduled job
    await schedulerService.updateScheduledPost(scheduledPost, {
      content,
      platforms,
      scheduledTime: new Date(scheduledTime),
      mediaUrls,
      hashtags
    });

    // Update in database
    const updatedPost = await prisma.scheduledPost.update({
      where: { id },
      data: {
        content,
        platforms,
        scheduledTime: new Date(scheduledTime),
        mediaUrls,
        hashtags
      }
    });

    res.json({
      success: true,
      message: 'Scheduled post updated successfully',
      data: { updatedPost }
    });

  } catch (error) {
    logger.error('Edit scheduled post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to edit scheduled post'
    });
  }
}

exports.deleteScheduledPost = async (req, res) => {
  try {
    const { id } = req.params;

    const scheduledPost = await prisma.scheduledPost.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!scheduledPost) {
      return res.status(404).json({
        success: false,
        message: 'Scheduled post not found'
      });
    }

    // Cancel the scheduled job
    await schedulerService.cancelScheduledPost(id);

    // Delete from database
    await prisma.scheduledPost.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Scheduled post deleted successfully'
    });

  } catch (error) {
    logger.error('Delete scheduled post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete scheduled post'
    });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, platform, status } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      userId: req.userId,
      ...(platform && { platform }),
      ...(status && { status })
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: parseInt(skip),
        take: parseInt(limit)
      }),
      prisma.post.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Get posts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts'
    });
  }
};

exports.getpostdetail = async (req,res) =>{
  try {
    const { id } = req.params;

    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: req.userId
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    res.json({
      success: true,
      data: { post }
    });

  } catch (error) {
    logger.error('Get post detail error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post details'
    });
  }
}

exports.deletePublishedPost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findFirst({
      where: {
        id,
        userId: req.userId,
        status: 'PUBLISHED'  // Only allow deleting published posts
      }
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found'
      });
    }

    // Delete from database
    await prisma.post.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (error) {
    logger.error('Delete post error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete post'
    });
  }
};






    










