import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreamingServiceFactory } from './streaming-service.factory';
import { HistoryService } from '../history/history.service';
import { GetStreamDto } from './dto/get-stream.dto';
import { YouTubeService } from './services/youtube.service';
import youtubedl from 'youtube-dl-exec';
import axios from 'axios';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Controller('stream')
export class StreamingController {
  constructor(
    private readonly streamingFactory: StreamingServiceFactory,
    private readonly historyService: HistoryService,
    private readonly youtubeService: YouTubeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStream(@Body() dto: GetStreamDto, @Request() req: any) {
    const service = this.streamingFactory.getService(dto.service);
    const result = await service.getStreamUrl(dto.trackId);

    // Auto-record play history
    try {
      const userId = req.user?._id ? req.user._id.toString() : req.user?.userId;
      if (userId) {
        await this.historyService.recordPlay(
          userId,
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
    } catch {
      // Non-blocking history logging failure
    }

    return result;
  }

  @Get('proxy')
  async proxyAudio(
    @Query('trackId') trackId: string,
    @Query('service') serviceName: string,
    @Req() req: ExpressRequest,
    @Res() res: ExpressResponse,
  ) {
    if (!trackId) {
      return res.status(400).json({ statusCode: 400, message: 'trackId is required' });
    }

    if (serviceName === 'youtube') {
      res.set({
        'Content-Type': 'audio/webm',
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      });

      try {
        const subprocess = youtubedl.exec(
          `https://www.youtube.com/watch?v=${trackId}`,
          {
            format: 'ba/b',
            output: '-',
            jsRuntimes: 'node',
          },
          {
            stdio: ['ignore', 'pipe', 'ignore'],
          },
        );

        if (subprocess.stdout) {
          subprocess.stdout.pipe(res);

          req.on('close', () => {
            try {
              subprocess.kill('SIGKILL');
            } catch {
              // Ignore process kill failure if already terminated
            }
          });
        } else {
          return res
            .status(502)
            .json({ statusCode: 502, message: 'No audio stdout stream available' });
        }
      } catch (err: any) {
        return res.status(502).json({
          statusCode: 502,
          message: `Failed to stream YouTube audio: ${err?.message || err}`,
        });
      }
      return;
    }

    // Jamendo / generic service fallback
    try {
      const service = this.streamingFactory.getService((serviceName as any) || 'jamendo');
      const streamResult = await service.getStreamUrl(trackId);
      const targetUrl = streamResult.streamUrl;

      const response = await axios({
        method: 'get',
        url: targetUrl,
        responseType: 'stream',
        timeout: 15000,
      });

      res.set({
        'Content-Type': response.headers['content-type'] || 'audio/mpeg',
        'Content-Length': response.headers['content-length'],
        'Accept-Ranges': 'bytes',
        'Access-Control-Allow-Origin': '*',
      });

      res.status(response.status);
      response.data.pipe(res);
    } catch (err: any) {
      res.status(502).json({
        statusCode: 502,
        message: `Failed to stream audio: ${err?.message || err}`,
      });
    }
  }
}
