// playlist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PlaylistDocument = Playlist & Document;

@Schema({ timestamps: true })
export class Playlist {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: '' })
  coverArt: string;

  @Prop({ default: false })
  isPublic: boolean;

  @Prop({ default: false })
  isCollaborative: boolean;

  @Prop({
    type: [{
      trackId: { type: String, required: true },
      service: { type: String, enum: ['jamendo', 'youtube'], required: true },
      title: { type: String, required: true },
      artist: { type: String, required: true },
      albumArt: { type: String, default: '' },
      duration: { type: Number, required: true },
      addedAt: { type: Date, default: Date.now },
      addedBy: { type: Types.ObjectId, ref: 'User' }
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
    addedAt: Date;
    addedBy: Types.ObjectId;
  }>;

  @Prop({ default: 0 })
  playCount: number;
}

export const PlaylistSchema = SchemaFactory.createForClass(Playlist);
PlaylistSchema.index({ userId: 1, name: 1 });
PlaylistSchema.index({ isPublic: 1 });