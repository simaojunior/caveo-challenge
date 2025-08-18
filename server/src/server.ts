import { config } from './config';

// eslint-disable-next-line no-console
console.log('🚀 Starting Caveo API server...');
// eslint-disable-next-line no-console
console.log(`📊 Environment: ${config.app.nodeEnv}`);
// eslint-disable-next-line no-console
console.log(`🌐 Host: ${config.app.host}:${config.app.port}`);
// eslint-disable-next-line no-console
console.log(`💾 Database: ${config.db.host}:${config.db.port}/${config.db.name}`);
