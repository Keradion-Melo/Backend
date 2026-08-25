import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { StreamingModule } from '../streaming/streaming.module';
import { MetadataModule } from '../metadata/metadata.module';

@Module({
  imports: [StreamingModule, MetadataModule],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
