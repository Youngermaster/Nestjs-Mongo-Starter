export default () => ({
  app: {
    port: parseInt(process.env.PORT || '3000', 10) || 3000,
    environment: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api',
  },
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/nestjs-starter',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10) || 10,
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED !== 'false',
    title: 'NestJS MongoDB Starter API',
    description: 'Enterprise-grade API documentation',
    version: '1.0',
    path: 'docs',
  },
  cors: {
    enabled: process.env.CORS_ENABLED !== 'false',
    origin: process.env.CORS_ORIGIN || '*',
  },
  logging: {
    enabled: process.env.LOGGING_ENABLED !== 'false',
  },
  oauth: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackUrl:
        process.env.GITHUB_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/github/callback',
    },
    microsoft: {
      clientId: process.env.AZURE_AD_CLIENT_ID,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET,
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      callbackUrl:
        process.env.AZURE_AD_CALLBACK_URL ||
        'http://localhost:3000/api/v1/auth/microsoft/callback',
    },
  },
});
