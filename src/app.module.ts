import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BodyLoggerMiddleware } from './common/middlewares/body-logger.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { QueueModule } from './modules/queue/queue.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { HistoryModule } from './modules/history/history.module';
import { MetadataModule } from './modules/metadata/metadata.module';
import { StreamingModule } from './modules/streaming/streaming.module';
import { SearchModule } from './modules/search/search.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import {
  appConfig,
  mongoConfig,
  jwtConfig,
  jamendoConfig,
  youtubeConfig,
} from './config/app.config';

@Module({
  imports: [
    // ── Config ──────────────────────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, mongoConfig, jwtConfig, jamendoConfig, youtubeConfig],
      envFilePath: '.env',
    }),

    // ── Database ─────────────────────────────────────────────────────────────
    MongooseModule.forRoot(process.env.MONGO_URI as string, {
      // recommended for NestJS / Mongoose 7+
      connectionFactory: (connection) => {
        connection.on('connected', () => console.log('✅  MongoDB connected'));
        connection.on('error', (err: Error) =>
          console.error('❌  MongoDB connection error:', err.message),
        );
        return connection;
      },
    }),

    // ── Rate-limiting ────────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60 s window  (v5 uses ms)
        limit: 10,
      },
    ]),

    // ── Feature Modules ──────────────────────────────────────────────────────
    AuthModule,
    UsersModule,
    PlaylistsModule,
    QueueModule,
    FavoritesModule,
    HistoryModule,
    MetadataModule,
    StreamingModule,
    SearchModule,
    RecommendationsModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(BodyLoggerMiddleware).forRoutes('*');
  }
}
