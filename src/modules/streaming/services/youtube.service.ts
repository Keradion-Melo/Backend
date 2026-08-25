import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import youtubedl from 'youtube-dl-exec';
import {
  IStreamingService,
  StreamMetadata,
  StreamResult,
  SearchResultItem,
} from '../interfaces/streaming-service.interface';

@Injectable()
export class YouTubeService implements IStreamingService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiKey?: string;
  private readonly streamCache = new Map<string, { url: string; expiresAt: number }>();

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('youtube.apiKey');
  }

  async getMetadata(trackId: string): Promise<Partial<StreamMetadata>> {
    if (this.apiKey) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/videos', {
          params: {
            part: 'snippet,contentDetails',
            id: trackId,
            key: this.apiKey,
          },
          timeout: 5000,
        });

        const item = response.data?.items?.[0];
        if (item) {
          return {
            title: item.snippet.title,
            artist: item.snippet.channelTitle,
            albumArt: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
            duration: 210,
            genre: ['youtube'],
          };
        }
      } catch (err: any) {
        this.logger.warn(`YouTube API getMetadata error for ${trackId}: ${err?.message || err}`);
      }
    }

    return {
      title: `YouTube Track #${trackId}`,
      artist: 'YouTube Creator',
      albumArt: `https://img.youtube.com/vi/${trackId}/hqdefault.jpg`,
      duration: 213,
      genre: ['youtube'],
    };
  }

  async getRawCdnUrl(trackId: string): Promise<string> {
    const cached = this.streamCache.get(trackId);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.url;
    }

    try {
      const output = await youtubedl(`https://www.youtube.com/watch?v=${trackId}`, {
        getUrl: true,
        format: 'ba/b',
        noCheckCertificates: true,
        noWarnings: true,
        jsRuntimes: 'node',
      });

      const streamUrl =
        typeof output === 'string' ? output.trim() : `https://www.youtube.com/watch?v=${trackId}`;
      this.streamCache.set(trackId, {
        url: streamUrl,
        expiresAt: Date.now() + 2 * 60 * 60 * 1000, // Cache for 2 hours
      });
      return streamUrl;
    } catch (err: any) {
      this.logger.warn(
        `Failed to extract direct audio URL with youtube-dl-exec for ${trackId}: ${err?.message || err}`,
      );
      const extractionError: any = new Error(
        `Could not extract audio for YouTube track ${trackId}`,
      );
      extractionError.cause = err;
      throw extractionError;
    }
  }

  async getStreamUrl(trackId: string): Promise<StreamResult> {
    const metadata = await this.getMetadata(trackId);

    // Ensure the raw URL can be extracted and cached
    try {
      await this.getRawCdnUrl(trackId);
    } catch (err: any) {
      this.logger.warn(`Pre-extraction error for ${trackId}: ${err?.message || err}`);
    }

    // Return proxy URL to bypass browser CORS / User-Agent blocks on googlevideo.com
    const streamUrl = `http://localhost:3000/api/stream/proxy?trackId=${trackId}&service=youtube`;

    return {
      streamUrl,
      metadata: {
        title: metadata.title || `YouTube Track #${trackId}`,
        artist: metadata.artist || 'YouTube Creator',
        albumArt: metadata.albumArt || `https://img.youtube.com/vi/${trackId}/hqdefault.jpg`,
        duration: metadata.duration || 213,
        genre: metadata.genre || ['youtube'],
      },
    };
  }

  async search(query: string, limit = 20): Promise<SearchResultItem[]> {
    if (this.apiKey) {
      try {
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            videoCategoryId: '10', // Music category
            maxResults: limit,
            key: this.apiKey,
          },
          timeout: 5000,
        });

        const items = response.data?.items || [];
        return items.map((item: any) => ({
          trackId: item.id.videoId,
          service: 'youtube' as const,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          albumArt: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url,
          duration: 213,
        }));
      } catch (err: any) {
        this.logger.warn(`YouTube search API error: ${err?.message || err}`);
      }
    }

    // Default demo fallback when API key is unconfigured
    return [
      {
        trackId: 'dQw4w9WgXcQ',
        service: 'youtube' as const,
        title: `${query} (YouTube Stream)`,
        artist: 'Rick Astley',
        albumArt: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        duration: 213,
      },
    ];
  }
}
