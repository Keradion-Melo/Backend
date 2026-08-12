// history.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type HistoryDocument = History & Document;

@Schema({ timestamps: true })
export class History {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  trackId: string;

  @Prop({ enum: ['jamendo', 'youtube'], required: true })
  service: 'jamendo' | 'youtube';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  artist: string;

  @Prop({ default: '' })
  albumArt: string;

  @Prop({ required: true })
  totalDuration: number;

  @Prop({ required: true })
  duration: number; // how long they listened

  @Prop({ default: Date.now })
  playedAt: Date;
}

export const HistorySchema = SchemaFactory.createForClass(History);
HistorySchema.index({ userId: 1, playedAt: -1 });