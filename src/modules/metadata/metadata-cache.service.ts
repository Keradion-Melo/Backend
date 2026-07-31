import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MetadataCache, MetadataCacheDocument } from '../../../schema/metadata-cache.schema';
import { StreamingServiceFactory } from '../streaming/streaming-service.factory';

export interface TrackMetadata {
  trackId: string;
  service: 'jamendo' | 'youtube';
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  genre: string[];
  releaseDate?: Date;
  popularity: number;
  expiresAt?: Date;
}

@Injectable()
export class MetadataCacheService {
  constructor(
    @InjectModel(MetadataCache.name) private readonly metadataModel: Model<MetadataCacheDocument>,
    @Inject(forwardRef(() => StreamingServiceFactory)) private readonly streamingFactory: StreamingServiceFactory,
  ) {}

  async enrich(trackData: Partial<TrackMetadata> & { trackId: string, service: 'jamendo' | 'youtube' }): Promise<MetadataCacheDocument> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    return this.metadataModel.findOneAndUpdate(
      { trackId: trackData.trackId, service: trackData.service },
      {
        ...trackData,
        expiresAt,
      },
      { new: true, upsert: true }
    ).exec();
  }

  async getOrFetch(trackId: string, service: 'jamendo' | 'youtube'): Promise<TrackMetadata> {
    const cached = await this.metadataModel.findOne({ trackId, service }).exec();
    
    // Check if missing or expired (though MongoDB TTL index automatically removes expired)
    if (cached && cached.expiresAt > new Date()) {
      return cached;
    }

    // Call appropriate streaming service (mocked for now, until StreamingModule is implemented)
    const fetchedData = await this.fetchFromStreamingService(trackId, service);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Save with upsert: true
    const updated = await this.metadataModel.findOneAndUpdate(
      { trackId, service },
      {
        ...fetchedData,
        expiresAt,
      },
      { new: true, upsert: true }
    ).exec();

    return updated;
  }

  async batchFetch(entries: { trackId: string, service: 'jamendo' | 'youtube' }[]): Promise<TrackMetadata[]> {
    // For efficiency, we could use Promise.all. A real production app might use a batch endpoint.
    return Promise.all(entries.map(entry => this.getOrFetch(entry.trackId, entry.service)));
  }

  private async fetchFromStreamingService(trackId: string, service: 'jamendo' | 'youtube'): Promise<Partial<TrackMetadata>> {
    const streamingService = this.streamingFactory.getService(service);
    return streamingService.getMetadata(trackId);
  }
}
