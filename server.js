require('dotenv').config();
const app = require('./src/app.js');
const logger = require('./src/utils/logger.js');
const schedulerService = require('./src/services/schedulerService.js');

const PORT = process.env.PORT || 3000;

// Start scheduler service
schedulerService.start();

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  schedulerService.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  schedulerService.stop();
  process.exit(0);
});
