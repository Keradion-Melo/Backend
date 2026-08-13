import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { MetadataCache, MetadataCacheDocument } from '../../../schema/metadata-cache.schema';
import { HistoryService } from '../history/history.service';
import { FavoritesService } from '../favorites/favorites.service';

@Injectable()
export class RecommendationsService {
  constructor(
    @InjectModel(MetadataCache.name) private readonly metadataModel: Model<MetadataCacheDocument>,
    private readonly historyService: HistoryService,
    private readonly favoritesService: FavoritesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getForUser(userId: string): Promise<MetadataCacheDocument[]> {
    const cacheKey = `recommendations_${userId}`;
    const cached = await this.cacheManager.get<MetadataCacheDocument[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const [history, favorites] = await Promise.all([
      this.historyService.getRecentHistory(userId, 50, 0),
      this.favoritesService.findAll(userId),
    ]);

    const artistCounts = new Map<string, number>();
    const genreCounts = new Map<string, number>();

    const excludeTrackIds = new Set<string>();
    favorites.forEach((f) => excludeTrackIds.add(f.trackId));
    history.forEach((h) => excludeTrackIds.add(h.trackId));

    const trackIdsToAnalyze = Array.from(excludeTrackIds);

    let recommendations: MetadataCacheDocument[] = [];

    if (trackIdsToAnalyze.length > 0) {
      const metadataEntries = await this.metadataModel
        .find({ trackId: { $in: trackIdsToAnalyze } })
        .exec();

      for (const meta of metadataEntries) {
        if (meta.artist) {
          artistCounts.set(meta.artist, (artistCounts.get(meta.artist) || 0) + 1);
        }
        for (const genre of meta.genre || []) {
          genreCounts.set(genre, (genreCounts.get(genre) || 0) + 1);
        }
      }

      const topArtists = [...artistCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map((e) => e[0]);
      const topGenres = [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map((e) => e[0]);

      if (topArtists.length > 0 || topGenres.length > 0) {
        recommendations = await this.metadataModel
          .find({
            trackId: { $nin: Array.from(excludeTrackIds) },
            $or: [{ artist: { $in: topArtists } }, { genre: { $in: topGenres } }],
          })
          .limit(20)
          .exec();
      }
    }

    // Fallback if not enough data or no recommendations found based on criteria
    if (recommendations.length === 0) {
      recommendations = await this.metadataModel
        .find({
          trackId: { $nin: Array.from(excludeTrackIds) },
        })
        .limit(20)
        .exec();
    }

    // Cache for 1 hour (3600000 milliseconds)
    await this.cacheManager.set(cacheKey, recommendations, 3600000);

    return recommendations;
  }
}
