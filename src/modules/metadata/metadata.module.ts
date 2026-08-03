import { Module, Global, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MetadataCache, MetadataCacheSchema } from '../../../schema/metadata-cache.schema';
import { MetadataCacheService } from './metadata-cache.service';
import { StreamingModule } from '../streaming/streaming.module';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: MetadataCache.name, schema: MetadataCacheSchema }]),
    forwardRef(() => StreamingModule),
  ],
  providers: [MetadataCacheService],
  exports: [MetadataCacheService],
})
export class MetadataModule {}
