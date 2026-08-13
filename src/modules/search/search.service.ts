import { Injectable } from '@nestjs/common';
import { StreamingServiceFactory } from '../streaming/streaming-service.factory';
import { MetadataCacheService } from '../metadata/metadata-cache.service';
import { SearchResultItem } from '../streaming/interfaces/streaming-service.interface';

@Injectable()
export class SearchService {
  constructor(
    private readonly streamingFactory: StreamingServiceFactory,
    private readonly metadataCacheService: MetadataCacheService,
  ) {}

  async search(query: string, serviceName: 'jamendo' | 'youtube' = 'jamendo', limit = 20): Promise<{ results: SearchResultItem[] }> {
    const service = this.streamingFactory.getService(serviceName);
    const results = await service.search(query, limit);

    // Asynchronously cache / enrich metadata in the background
    Promise.allSettled(
      results.map((item) =>
        this.metadataCacheService.enrich({
          trackId: item.trackId,
          service: item.service,
          title: item.title,
          artist: item.artist,
          albumArt: item.albumArt || '',
          duration: item.duration,
          genre: [],
          popularity: 50,
        }),
      ),
    ).catch(() => {});

    return { results };
  }
}
