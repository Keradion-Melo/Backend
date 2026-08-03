import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JamendoService } from './services/jamendo.service';
import { YouTubeService } from './services/youtube.service';
import { StreamingServiceFactory } from './streaming-service.factory';
import { StreamingController } from './streaming.controller';
import { HistoryModule } from '../history/history.module';
import { MetadataModule } from '../metadata/metadata.module';

@Module({
  imports: [
    ConfigModule,
    HistoryModule,
    forwardRef(() => MetadataModule),
  ],
  controllers: [StreamingController],
  providers: [
    JamendoService,
    YouTubeService,
    StreamingServiceFactory,
  ],
  exports: [
    StreamingServiceFactory,
    JamendoService,
    YouTubeService,
  ],
})
export class StreamingModule {}
