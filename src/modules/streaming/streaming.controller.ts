import { Controller, Post, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreamingServiceFactory } from './streaming-service.factory';
import { HistoryService } from '../history/history.service';
import { GetStreamDto } from './dto/get-stream.dto';

@Controller('stream')
@UseGuards(JwtAuthGuard)
export class StreamingController {
  constructor(
    private readonly streamingFactory: StreamingServiceFactory,
    private readonly historyService: HistoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async getStream(@Body() dto: GetStreamDto, @Request() req: any) {
    const service = this.streamingFactory.getService(dto.service);
    const result = await service.getStreamUrl(dto.trackId);

    // Auto-record play history
    try {
      if (req.user?.userId) {
        await this.historyService.recordPlay(
          req.user.userId,
          {
            trackId: dto.trackId,
            service: dto.service,
            title: result.metadata.title,
            artist: result.metadata.artist,
            albumArt: result.metadata.albumArt,
          },
          result.metadata.duration || 0,
          result.metadata.duration || 0,
        );
      }
    } catch (err) {
      // Non-blocking history logging failure
    }

    return result;
  }
}
