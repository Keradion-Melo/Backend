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
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreamingServiceFactory } from './streaming-service.factory';
import { HistoryService } from '../history/history.service';
import { GetStreamDto } from './dto/get-stream.dto';
import { RecordPlaybackDto } from './dto/record-playback.dto';
import { YouTubeService } from './services/youtube.service';
import youtubedl from 'youtube-dl-exec';
import axios from 'axios';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';

@Controller('stream')
export class StreamingController {
  private readonly logger = new Logger(StreamingController.name);

  constructor(
    private readonly streamingFactory: StreamingServiceFactory,
    private readonly historyService: HistoryService,
    private readonly youtubeService: YouTubeService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async getStream(@Body() dto: GetStreamDto) {
    const service = this.streamingFactory.getService(dto.service);
    const result = await service.getStreamUrl(dto.trackId);
    return result;
  }

  @Post('played')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async recordPlayback(@Body() dto: RecordPlaybackDto, @Request() req: any) {
    try {
      const userId = req.user?._id ? req.user._id.toString() : req.user?.userId;
      if (userId) {
        await this.historyService.recordPlay(
          userId,
          {
            trackId: dto.trackId,
            service: dto.service,
            title: dto.title || `Track #${dto.trackId}`,
            artist: dto.artist || 'Unknown Artist',
            albumArt: dto.albumArt,
          },
          dto.duration || 0,
          dto.position || 0,
        );
      }
      return { statusCode: 200, message: 'Playback recorded' };
    } catch (err: any) {
      this.logger.warn(
        `Failed to record playback event for ${dto.trackId}: ${err?.message || err}`,
      );
      return { statusCode: 200, message: 'Playback record ignored' };
    }
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
      // Strategy 1: Direct CDN URL streaming with HTTP 206 Range support
      try {
        const directUrl = await this.youtubeService.getRawCdnUrl(trackId);
        const headers: Record<string, string> = {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        };

        if (req.headers.range) {
          headers['Range'] = req.headers.range;
        }

        const cancelSource = axios.CancelToken.source();
        const response = await axios({
          method: 'GET',
          url: directUrl,
          responseType: 'stream',
          headers,
          timeout: 25000,
          cancelToken: cancelSource.token,
        });

        // Abort upstream request when client socket closes
        req.on('close', () => {
          cancelSource.cancel('Client disconnected');
        });

        res.set({
          'Content-Type': response.headers['content-type'] || 'audio/mp4',
          'Content-Length': response.headers['content-length'],
          'Content-Range': response.headers['content-range'],
          'Accept-Ranges': 'bytes',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': '*',
        });

        res.status(response.status);
        response.data.pipe(res);
        return;
      } catch (cdnErr: any) {
        this.logger.warn(
          `Direct CDN stream failed for ${trackId}, falling back to yt-dlp pipe: ${cdnErr?.message || cdnErr}`,
        );
      }

      // Strategy 2: yt-dlp piped process with safe error handling
      try {
        const subprocess = youtubedl.exec(
          `https://www.youtube.com/watch?v=${trackId}`,
          {
            format: '140/ba/b',
            output: '-',
            jsRuntimes: 'node',
          },
          {
            stdio: ['ignore', 'pipe', 'ignore'],
          },
        );

        // Catch promise rejection on child process termination
        subprocess.catch(() => {});

        if (subprocess.stdout) {
          res.set({
            'Content-Type': 'audio/mp4',
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': '*',
          });

          subprocess.stdout.pipe(res);

          req.on('close', () => {
            try {
              subprocess.kill('SIGKILL');
            } catch {
              // Ignore process kill error
            }
          });
          return;
        }
      } catch (err: any) {
        this.logger.error(`YouTube stream fallback failed for ${trackId}: ${err?.message || err}`);
        return res.status(502).json({
          statusCode: 502,
          message: `Failed to stream YouTube audio: ${err?.message || err}`,
        });
      }
    }

    // Jamendo / generic service fallback
    try {
      const service = this.streamingFactory.getService((serviceName as any) || 'jamendo');
      const streamResult = await service.getStreamUrl(trackId);
      const targetUrl = streamResult.streamUrl;

      const cancelSource = axios.CancelToken.source();
      const response = await axios({
        method: 'get',
        url: targetUrl,
        responseType: 'stream',
        timeout: 15000,
        cancelToken: cancelSource.token,
      });

      req.on('close', () => {
        cancelSource.cancel('Client disconnected');
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
