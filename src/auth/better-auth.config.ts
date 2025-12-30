import { betterAuth } from 'better-auth';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';
import { MongoClient } from 'mongodb';

// MongoDB connection will be shared with the main NestJS MongoDB connection
// This should use the same MONGODB_URI from your environment
const client = new MongoClient(
  process.env.MONGODB_URI ||
    'mongodb://admin:password123@localhost:27017/nestjs-starter?authSource=admin',
);

export const auth = betterAuth({
  // Database configuration with MongoDB adapter
  database: mongodbAdapter(client.db()),

  // Base URL for your application
  baseURL: process.env.APP_URL || 'http://localhost:3000',

  // Social providers configuration
  socialProviders: {
    // Microsoft Entra ID (formerly Azure AD)
    microsoft: {
      clientId: process.env.AZURE_AD_CLIENT_ID || '',
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET || '',
      tenantId: process.env.AZURE_AD_TENANT_ID || 'common',
      enabled: !!(
        process.env.AZURE_AD_CLIENT_ID && process.env.AZURE_AD_CLIENT_SECRET
      ),
    },

    // GitHub OAuth
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
      enabled: !!(
        process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ),
    },
  },

  // Email & password authentication (existing functionality)
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // Can be enabled later
  },

  // Security settings
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },

  // Advanced options
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === 'production',
    },
    generateId: () => {
      // Custom ID generation if needed
      return crypto.randomUUID();
    },
  },

  // Trusted origins for CORS
  trustedOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:3001',
    'http://localhost:3000',
  ],
});

// Export types for use in your NestJS application
export type Auth = typeof auth;
