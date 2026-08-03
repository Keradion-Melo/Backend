import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { IStreamingService, StreamMetadata, StreamResult, SearchResultItem } from '../interfaces/streaming-service.interface';

@Injectable()
export class JamendoService implements IStreamingService {
  private readonly logger = new Logger(JamendoService.name);
  private readonly clientId: string;
  private readonly apiBase: string;

  constructor(private readonly configService: ConfigService) {
    this.clientId = this.configService.get<string>('jamendo.clientId') || 'default_client_id';
    this.apiBase = this.configService.get<string>('jamendo.apiBase') || 'https://api.jamendo.com/v3.0';
  }

  async getMetadata(trackId: string): Promise<Partial<StreamMetadata>> {
    try {
      const response = await axios.get(`${this.apiBase}/tracks/`, {
        params: {
          client_id: this.clientId,
          format: 'json',
          id: trackId,
        },
        timeout: 5000,
      });

      const track = response.data?.results?.[0];
      if (!track) {
        return {
          title: `Jamendo Track #${trackId}`,
          artist: 'Unknown Artist',
          duration: 180,
          genre: ['indie'],
        };
      }

      return {
        title: track.name || `Jamendo Track #${trackId}`,
        artist: track.artist_name || 'Jamendo Artist',
        albumArt: track.album_image || track.image,
        duration: track.duration || 180,
        genre: track.musicinfo?.tags?.genres || ['indie'],
        popularity: track.stats?.rate || 50,
      };
    } catch (error: any) {
      this.logger.warn(`Failed to fetch Jamendo metadata for ${trackId}: ${error?.message || error}`);
      return {
        title: `Jamendo Track #${trackId}`,
        artist: 'Jamendo Artist',
        albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        duration: 215,
        genre: ['pop', 'rock'],
      };
    }
  }

  async getStreamUrl(trackId: string): Promise<StreamResult> {
    const metadata = await this.getMetadata(trackId);
    const streamUrl = `https://api.jamendo.com/v3.0/tracks/file/?id=${trackId}&client_id=${this.clientId}&audioformat=mp32`;

    return {
      streamUrl,
      metadata: {
        title: metadata.title || `Jamendo Track #${trackId}`,
        artist: metadata.artist || 'Jamendo Artist',
        albumArt: metadata.albumArt || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
        duration: metadata.duration || 215,
        genre: metadata.genre || ['pop', 'rock'],
      },
    };
  }

  async search(query: string, limit = 20): Promise<SearchResultItem[]> {
    try {
      const response = await axios.get(`${this.apiBase}/tracks/`, {
        params: {
          client_id: this.clientId,
          format: 'json',
          search: query,
          limit,
          include: 'musicinfo',
        },
        timeout: 5000,
      });

      const results = response.data?.results || [];
      return results.map((item: any) => ({
        trackId: String(item.id),
        service: 'jamendo' as const,
        title: item.name || 'Untitled',
        artist: item.artist_name || 'Unknown Artist',
        albumArt: item.album_image || item.image,
        duration: item.duration || 180,
      }));
    } catch (error: any) {
      this.logger.warn(`Jamendo search failed for "${query}": ${error?.message || error}`);
      return [
        {
          trackId: '112345',
          service: 'jamendo' as const,
          title: `${query} (Jamendo Demo)`,
          artist: 'Featured Artist',
          albumArt: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300',
          duration: 215,
        },
      ];
    }
  }
}
