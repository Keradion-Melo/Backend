import { registerAs } from '@nestjs/config';

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
}));

export const mongoConfig = registerAs('mongo', () => ({
  uri: process.env.MONGO_URI,
}));

export const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  expiresIn: process.env.JWT_EXPIRES_IN ?? '15m',
  refreshSecret: process.env.REFRESH_SECRET,
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN ?? '7d',
}));

export const jamendoConfig = registerAs('jamendo', () => ({
  clientId: process.env.JAMENDO_CLIENT_ID,
  apiBase: process.env.JAMENDO_API_BASE ?? 'https://api.jamendo.com/v3.0',
}));

export const youtubeConfig = registerAs('youtube', () => ({
  apiKey: process.env.YOUTUBE_API_KEY,
}));
