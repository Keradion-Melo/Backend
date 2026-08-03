import { Injectable, BadRequestException } from '@nestjs/common';
import { JamendoService } from './services/jamendo.service';
import { YouTubeService } from './services/youtube.service';
import { IStreamingService } from './interfaces/streaming-service.interface';

@Injectable()
export class StreamingServiceFactory {
  constructor(
    private readonly jamendoService: JamendoService,
    private readonly youtubeService: YouTubeService,
  ) {}

  getService(service: 'jamendo' | 'youtube' | string): IStreamingService {
    switch (service?.toLowerCase()) {
      case 'jamendo':
        return this.jamendoService;
      case 'youtube':
        return this.youtubeService;
      default:
        throw new BadRequestException(`Unsupported streaming service: ${service}. Allowed: jamendo, youtube`);
    }
  }
}
