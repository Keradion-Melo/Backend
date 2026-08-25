import {
  Controller,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { HistoryService } from './history.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('history')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) {}

  @Get()
  getRecentHistory(
    @Request() req,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number,
  ) {
    return this.historyService.getRecentHistory(req.user._id.toString(), limit, offset);
  }

  @Delete()
  clearHistory(@Request() req) {
    return this.historyService.clearHistory(req.user._id.toString());
  }

  @Delete(':id')
  removeHistoryEntry(@Request() req, @Param('id') id: string) {
    return this.historyService.removeHistoryEntry(req.user._id.toString(), id);
  }
}
