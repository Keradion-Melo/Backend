// metadata-cache.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetadataCacheDocument = MetadataCache & Document;

@Schema({ timestamps: true })
export class MetadataCache {
  @Prop({ required: true, unique: true })
  trackId: string; // composite identifier: service + id

  @Prop({ enum: ['jamendo', 'youtube'], required: true })
  service: 'jamendo' | 'youtube';

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  artist: string;

  @Prop({ default: '' })
  albumArt: string;

  @Prop({ required: true })
  duration: number;

  @Prop({ type: [String], default: [] })
  genre: string[];

  @Prop()
  releaseDate: Date;

  @Prop({ default: 0 })
  popularity: number;

  @Prop({ required: true, index: { expires: 0 } })
  expiresAt: Date;
}

export const MetadataCacheSchema = SchemaFactory.createForClass(MetadataCache);
MetadataCacheSchema.index({ trackId: 1, service: 1 }, { unique: true });
MetadataCacheSchema.index({ artist: 1 });
MetadataCacheSchema.index({ genre: 1 });