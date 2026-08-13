import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
@UseGuards(JwtAuthGuard)
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async searchTracks(@Query() queryDto: SearchQueryDto) {
    const service = queryDto.service || 'jamendo';
    const limit = queryDto.limit || 20;
    return this.searchService.search(queryDto.q, service, limit);
  }
}
