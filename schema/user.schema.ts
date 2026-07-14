// user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({
    type: {
      avatarUrl: { type: String, default: '' },
      displayName: { type: String, required: true },
      bio: { type: String, default: '' }
    },
    default: () => ({})
  })
  profile: {
    avatarUrl: string;
    displayName: string;
    bio: string;
  };

  @Prop({
    type: {
      defaultService: { type: String, enum: ['jamendo', 'youtube'], default: 'jamendo' },
      theme: { type: String, enum: ['dark', 'light'], default: 'dark' },
      autoplay: { type: Boolean, default: true },
      quality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    default: () => ({})
  })
  preferences: {
    defaultService: 'jamendo' | 'youtube';
    theme: 'dark' | 'light';
    autoplay: boolean;
    quality: 'low' | 'medium' | 'high';
  };

  @Prop({ type: String })
  refreshToken?: string;

  @Prop({ default: Date.now })
  lastActive: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
UserSchema.index({ email: 1, username: 1 });
