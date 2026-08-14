import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import youtubedl from 'youtube-dl-exec';
import { IStreamingService, StreamMetadata, StreamResult, SearchResultItem } from '../interfaces/streaming-service.interface';

@Injectable()
export class YouTubeService implements IStreamingService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiKey?: string;

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
      title: `YouTube Video ${trackId}`,
      artist: 'YouTube Artist',
      albumArt: `https://img.youtube.com/vi/${trackId}/hqdefault.jpg`,
      duration: 213,
      genre: ['youtube'],
    };
  }

  async getStreamUrl(trackId: string): Promise<StreamResult> {
    const metadata = await this.getMetadata(trackId);
    let streamUrl: string;

    try {
      // Extract direct audio stream URL via youtube-dl-exec
      const output = await youtubedl(`https://www.youtube.com/watch?v=${trackId}`, {
        getUrl: true,
        format: 'bestaudio[ext=m4a]/bestaudio/best',
        noCheckCertificates: true,
        noWarnings: true,
      });

      streamUrl = typeof output === 'string' ? output.trim() : `https://www.youtube.com/watch?v=${trackId}`;
    } catch (err: any) {
      this.logger.warn(`Failed to extract direct audio URL with youtube-dl-exec for ${trackId}: ${err?.message || err}`);
      streamUrl = `https://www.youtube.com/watch?v=${trackId}`;
    }

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
