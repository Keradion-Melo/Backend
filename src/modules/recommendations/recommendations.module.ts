import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from '@nestjs/cache-manager';
import { RecommendationsService } from './recommendations.service';
import { RecommendationsController } from './recommendations.controller';
import { HistoryModule } from '../history/history.module';
import { FavoritesModule } from '../favorites/favorites.module';
import { MetadataCache, MetadataCacheSchema } from '../../../schema/metadata-cache.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: MetadataCache.name, schema: MetadataCacheSchema }]),
    CacheModule.register(),
    HistoryModule,
    FavoritesModule,
  ],
  controllers: [RecommendationsController],
  providers: [RecommendationsService],
})
export class RecommendationsModule {}
