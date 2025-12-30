import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  MONGODB_URI: Joi.string().required(),

  JWT_ACCESS_SECRET: Joi.string().required().min(32),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().required().min(32),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),

  BCRYPT_SALT_ROUNDS: Joi.number().default(10).min(10).max(15),

  SWAGGER_ENABLED: Joi.boolean().default(true),
  CORS_ENABLED: Joi.boolean().default(true),
  CORS_ORIGIN: Joi.string().default('*'),

  // GitHub OAuth
  GITHUB_CLIENT_ID: Joi.string().optional(),
  GITHUB_CLIENT_SECRET: Joi.string().optional(),
  GITHUB_CALLBACK_URL: Joi.string().uri().optional(),

  // Microsoft 365 OAuth
  AZURE_AD_CLIENT_ID: Joi.string().optional(),
  AZURE_AD_CLIENT_SECRET: Joi.string().optional(),
  AZURE_AD_TENANT_ID: Joi.string().default('common'),
  AZURE_AD_CALLBACK_URL: Joi.string().uri().optional(),
});
