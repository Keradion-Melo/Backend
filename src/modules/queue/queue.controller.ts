import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Put,
  ParseIntPipe,
} from '@nestjs/common';
import { QueueService } from './queue.service';
import { AddQueueTrackDto } from './dto/add-track.dto';
import { UpdateCurrentDto } from './dto/update-current.dto';
import { ReorderQueueDto } from './dto/reorder-queue.dto';
import { SyncQueueDto } from './dto/sync-queue.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { QueueOwnerGuard } from './guards/queue-owner.guard';

@UseGuards(JwtAuthGuard, QueueOwnerGuard)
@Controller('queue')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Get()
  getQueue(@Request() req) {
    return this.queueService.getQueue(req.user._id.toString(), req.sessionId);
  }

  @Post('add')
  addTrack(@Request() req, @Body() addTrackDto: AddQueueTrackDto) {
    return this.queueService.addTrack(req.user._id.toString(), req.sessionId, addTrackDto);
  }

  @Delete('remove/:position')
  removeTrack(@Request() req, @Param('position', ParseIntPipe) position: number) {
    return this.queueService.removeTrack(req.user._id.toString(), req.sessionId, position);
  }

  @Put('reorder')
  reorderTracks(@Request() req, @Body() reorderDto: ReorderQueueDto) {
    return this.queueService.reorderTracks(
      req.user._id.toString(),
      req.sessionId,
      reorderDto.order,
    );
  }

  @Patch('current')
  updateCurrent(@Request() req, @Body() updateCurrentDto: UpdateCurrentDto) {
    return this.queueService.updateCurrent(
      req.user._id.toString(),
      req.sessionId,
      updateCurrentDto,
    );
  }

  @Delete('clear')
  clearQueue(@Request() req) {
    return this.queueService.clearQueue(req.user._id.toString(), req.sessionId);
  }

  @Put('sync')
  syncQueue(@Request() req, @Body() syncQueueDto: SyncQueueDto) {
    return this.queueService.syncQueue(req.user._id.toString(), req.sessionId, syncQueueDto);
  }
}
