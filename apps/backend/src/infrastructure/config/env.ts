import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment variable schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Application
  APP_NAME: z.string().default('Kanban App'),
  FRONTEND_URL: z.string().default('http://localhost:4001'),
  
  // Optional features
  ENABLE_REGISTRATION: z.string().default('true').transform(val => val === 'true'),
  MAX_LOGIN_ATTEMPTS: z.string().default('5').transform(Number),
  LOGIN_LOCKOUT_DURATION: z.string().default('15').transform(Number), // minutes
  
  // Redis (optional for token blacklist)
  REDIS_URL: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  
  // AWS Cognito
  AWS_REGION: z.string().optional(),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  COGNITO_USER_POOL_ID: z.string().optional(),
  COGNITO_CLIENT_ID: z.string().optional(),
  COGNITO_CLIENT_SECRET: z.string().optional(),
});

// Type for validated environment variables
export type Env = z.infer<typeof envSchema>;

// Validate and export environment variables
function validateEnv(): Env {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      console.error(error.flatten().fieldErrors);
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();

// Export individual config objects for better organization
export const serverConfig = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
} as const;

export const databaseConfig = {
  url: env.DATABASE_URL,
} as const;

export const appConfig = {
  name: env.APP_NAME,
  frontendUrl: env.FRONTEND_URL,
  enableRegistration: env.ENABLE_REGISTRATION,
  maxLoginAttempts: env.MAX_LOGIN_ATTEMPTS,
  loginLockoutDuration: env.LOGIN_LOCKOUT_DURATION,
} as const;

export const redisConfig = {
  url: env.REDIS_URL,
  password: env.REDIS_PASSWORD,
} as const;

export const cognitoConfig = {
  region: env.AWS_REGION,
  accessKeyId: env.AWS_ACCESS_KEY_ID,
  secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
  userPoolId: env.COGNITO_USER_POOL_ID,
  clientId: env.COGNITO_CLIENT_ID,
  clientSecret: env.COGNITO_CLIENT_SECRET,
  isConfigured: !!(env.COGNITO_USER_POOL_ID && env.COGNITO_CLIENT_ID),
} as const;