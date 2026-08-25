import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueService } from './queue.service';
import { QueueController } from './queue.controller';
import { Queue, QueueSchema } from '../../../schema/queue.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Queue.name, schema: QueueSchema }])],
  controllers: [QueueController],
  providers: [QueueService],
  exports: [QueueService],
})
export class QueueModule {}
