// queue.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QueueDocument = Queue & Document;

@Schema({ timestamps: true })
export class Queue {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  sessionId: string; // for multi-device sync

  @Prop({
    type: [{
      trackId: { type: String, required: true },
      service: { type: String, enum: ['jamendo', 'youtube'], required: true },
      title: { type: String, required: true },
      artist: { type: String, required: true },
      albumArt: { type: String, default: '' },
      duration: { type: Number, required: true },
      requestedBy: { type: Types.ObjectId, ref: 'User' },
      position: { type: Number, required: true }
    }],
    default: []
  })
  tracks: Array<{
    trackId: string;
    service: 'jamendo' | 'youtube';
    title: string;
    artist: string;
    albumArt: string;
    duration: number;
    requestedBy: Types.ObjectId;
    position: number;
  }>;

  @Prop({ default: -1 })
  currentIndex: number;

  @Prop({ enum: ['playing', 'paused', 'stopped'], default: 'stopped' })
  status: 'playing' | 'paused' | 'stopped';

  @Prop({ default: 0 })
  currentTime: number;
}

export const QueueSchema = SchemaFactory.createForClass(Queue);
QueueSchema.index({ userId: 1, sessionId: 1 }, { unique: true });