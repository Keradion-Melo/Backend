// favorite.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type FavoriteDocument = Favorite & Document;

@Schema({ timestamps: true })
export class Favorite {
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

  @Prop({ default: Date.now })
  addedAt: Date;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, trackId: 1, service: 1 }, { unique: true });