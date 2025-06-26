const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const PLATFORM_PROMPTS = {
  INSTAGRAM: {
    professional: "Create an engaging Instagram post that's visually appealing and professional. Include relevant hashtags and keep it concise yet impactful.",
    casual: "Write a casual, friendly Instagram post that feels authentic and relatable. Use emojis and hashtags naturally.",
    creative: "Create a creative and artistic Instagram post that stands out. Be innovative with language and include trending hashtags."
  },
  LINKEDIN: {
    professional: "Write a professional LinkedIn post that adds value to your network. Focus on insights, industry knowledge, or career advice. Keep it informative and engaging.",
    casual: "Create a LinkedIn post that's professional yet approachable. Share experiences or lessons learned in a conversational tone.",
    creative: "Write an innovative LinkedIn post that showcases thought leadership. Be creative while maintaining professionalism."
  },
  TWITTER: {
    professional: "Create a concise, professional Twitter post (under 280 characters) that delivers value. Include relevant hashtags and make it shareable.",
    casual: "Write a casual Twitter post that's engaging and conversational. Keep it under 280 characters with natural hashtags.",
    creative: "Create a witty, creative Twitter post that stands out in the feed. Be clever and engaging within the character limit."
  }
};

const LENGTH_GUIDELINES = {
  short: "Keep it brief and to the point (1-2 sentences).",
  medium: "Write a moderate length post (2-4 sentences).",
  long: "Create a longer, more detailed post (4-6 sentences)."
};

class AIService {
  async generateContent({ prompt, platform, tone = 'professional', length = 'medium' }) {
    try {
      const platformPrompt = PLATFORM_PROMPTS[platform]?.[tone] || PLATFORM_PROMPTS[platform]?.professional;
      const lengthGuideline = LENGTH_GUIDELINES[length];

      const systemPrompt = `${platformPrompt} ${lengthGuideline}

Platform-specific guidelines:
- Instagram: Include 3-5 relevant hashtags, use emojis appropriately
- LinkedIn: Focus on professional value, no excessive hashtags
- Twitter: Stay under 280 characters, use 1-2 hashtags max

Always make the content engaging, authentic, and platform-appropriate.`;

      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: `Create a ${platform.toLowerCase()} post about: ${prompt}`
          }
        ],
        max_tokens: platform === 'TWITTER' ? 100 : 300,
        temperature: 0.7
      });

      const generatedContent = response.choices[0].message.content.trim();
      
      // Platform-specific post-processing
      if (platform === 'TWITTER' && generatedContent.length > 280) {
        // Truncate if too long for Twitter
        return generatedContent.substring(0, 277) + '...';
      }

      return generatedContent;

    } catch (error) {
      logger.error('AI content generation error:', error);
      throw new Error('Failed to generate content');
    }
  }

  async generateHashtags(content, platform, count = 5) {
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: `Generate ${count} relevant hashtags for ${platform} based on the given content. Return only the hashtags separated by spaces, each starting with #.`
          },
          {
            role: "user",
            content: content
          }
        ],
        max_tokens: 100,
        temperature: 0.5
      });

      const hashtags = response.choices[0].message.content
        .trim()
        .split(/\s+/)
        .filter(tag => tag.startsWith('#'))
        .slice(0, count);

      return hashtags;

    } catch (error) {
      logger.error('Hashtag generation error:', error);
      return [];
    }
  }
}

module.exports = new AIService();