import { env, exit } from 'node:process';
import { z } from 'zod';

function loadAppEnvs() {
  const appEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce
      .number()
      .default(3000)
      .refine((port) => port >= 0 && port <= 65535, {
        message: 'Port must be between 0 and 65535',
      }),
    BODY_LIMIT: z.coerce.number().default(15728640), // 15MB
    RATE_LIMIT_DURATION: z.coerce.number().default(60 * 1000), // 1 minute in ms
    RATE_LIMIT_MAX: z.coerce.number().default(100), // requests per window
  })
    .transform((data) => ({
      nodeEnv: data.NODE_ENV,
      host: data.HOST,
      port: data.PORT,
      bodyLimit: data.BODY_LIMIT,
      rateLimit: {
        duration: data.RATE_LIMIT_DURATION,
        max: data.RATE_LIMIT_MAX,
      },
    }));

  return appEnvSchema.parse(env);
}

function loadDatabaseEnvs() {
  const dbEnvSchema = z.object({
    DB_HOST: z.string().default('localhost'),
    DB_PORT: z.coerce.number().default(5432),
    DB_USER: z.string().default('caveo'),
    DB_PASSWORD: z.string().default('caveo'),
    DB_NAME: z.string().default('caveo'),
  })
    .transform((data) => ({
      host: data.DB_HOST,
      port: data.DB_PORT,
      user: data.DB_USER,
      password: data.DB_PASSWORD,
      name: data.DB_NAME,
    }));

  return dbEnvSchema.parse(env);
}

function loadRedisEnvs() {
  const redisEnvSchema = z.object({
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    REDIS_PASSWORD: z.string().optional(),
  })
    .transform((data) => ({
      host: data.REDIS_HOST,
      port: data.REDIS_PORT,
      password: data.REDIS_PASSWORD,
    }));

  return redisEnvSchema.parse(env);
}

function loadAwsEnvs() {
  const isTest = env.NODE_ENV === 'test';

  const awsEnvSchema = z.object({
    AWS_ACCESS_KEY_ID: isTest ? z.string().default('test-access-key') : z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
    AWS_SECRET_ACCESS_KEY: isTest ? z.string().default('test-secret-key') : z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
    AWS_COGNITO_USER_POOL_ID: isTest ? z.string().default('test-pool-id') : z.string().min(1, 'AWS_COGNITO_USER_POOL_ID is required'),
    AWS_COGNITO_CLIENT_SECRET: isTest ? z.string().default('test-client-secret') : z.string().min(1, 'AWS_COGNITO_CLIENT_SECRET is required'),
    AWS_COGNITO_CLIENT_ID: isTest ? z.string().default('test-client-id') : z.string().min(1, 'AWS_COGNITO_CLIENT_ID is required'),
    AWS_COGNITO_JWKS_URI: isTest ? z.string().default('https://cognito-idp.test-us.amazonaws.com/test-pool-id/.well-known/jwks.json') : z.string().min(1, 'AWS_COGNITO_JWKS_URI is required'),
    AWS_REGION: z.string().default('us-east-1'),
  })
    .transform((data) => ({
      accessKeyId: data.AWS_ACCESS_KEY_ID,
      secretAccessKey: data.AWS_SECRET_ACCESS_KEY,
      cognitoUserPoolId: data.AWS_COGNITO_USER_POOL_ID,
      cognitoClientSecret: data.AWS_COGNITO_CLIENT_SECRET,
      cognitoClientId: data.AWS_COGNITO_CLIENT_ID,
      cognitoJwksUri: data.AWS_COGNITO_JWKS_URI,
      region: data.AWS_REGION,
    }));

  return awsEnvSchema.parse(env);
}

function loadAuthEnvs() {
  const isTest = env.NODE_ENV === 'test';

  const authEnvSchema = z.object({
    JWT_EXPECTED_ISSUER: isTest ? z.string().default('https://cognito-idp.us-east-1.amazonaws.com/test-pool-id') : z.string(),
  })
    .transform((data) => ({
      jwtExpectedIssuer: data.JWT_EXPECTED_ISSUER,
    }));

  return authEnvSchema.parse(env);
}

function loadLoggingEnvs() {
  const loggingEnvSchema = z.object({
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
    APP_NAME: z.string().default('caveo-api'),
    LOG_ENVIRONMENT: z.string().default('development'),
  })
    .transform((data) => ({
      level: data.LOG_LEVEL,
      appName: data.APP_NAME,
      environment: data.LOG_ENVIRONMENT,
    }));

  return loggingEnvSchema.parse(env);
}

const appConfiguration = (() => {
  try {
    const config = {
      app: loadAppEnvs(),
      db: loadDatabaseEnvs(),
      redis: loadRedisEnvs(),
      aws: loadAwsEnvs(),
      auth: loadAuthEnvs(),
      logging: loadLoggingEnvs(),
    };

    return {
      ...config,
      isProduction: config.app.nodeEnv === 'production',
      isDevelopment: config.app.nodeEnv === 'development',
      isTest: config.app.nodeEnv === 'test',
      isStaging: config.app.nodeEnv === 'staging',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.issues.map((err) => `=> ${err.path.join('.')} ${err.message}`).join('\n');
      // eslint-disable-next-line no-console
      console.error('Environment variables error: \n%s', errors);

      exit(1);
    }

    // eslint-disable-next-line no-console
    console.error('Failed to load configuration:', error);
    exit(1);
  }
})();

export type Config = typeof appConfiguration;
export const config = appConfiguration;
