import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../../schema/user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByUsername(username: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(user: Partial<User>): Promise<UserDocument> {
    const newUser = new this.userModel(user);
    return newUser.save();
  }

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { refreshToken }).exec();
  }

  async findSafeById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-passwordHash -refreshToken').exec();
  }

  async updateProfile(id: string, updateData: UpdateProfileDto): Promise<UserDocument | null> {
    const updateQuery: any = {};

    if (updateData.profile) {
      if (updateData.profile.displayName !== undefined)
        updateQuery['profile.displayName'] = updateData.profile.displayName;
      if (updateData.profile.bio !== undefined) updateQuery['profile.bio'] = updateData.profile.bio;
      if (updateData.profile.avatarUrl !== undefined)
        updateQuery['profile.avatarUrl'] = updateData.profile.avatarUrl;
    }

    if (updateData.preferences) {
      if (updateData.preferences.defaultService !== undefined)
        updateQuery['preferences.defaultService'] = updateData.preferences.defaultService;
      if (updateData.preferences.theme !== undefined)
        updateQuery['preferences.theme'] = updateData.preferences.theme;
      if (updateData.preferences.autoplay !== undefined)
        updateQuery['preferences.autoplay'] = updateData.preferences.autoplay;
      if (updateData.preferences.quality !== undefined)
        updateQuery['preferences.quality'] = updateData.preferences.quality;
    }

    if (Object.keys(updateQuery).length > 0) {
      return this.userModel
        .findByIdAndUpdate(id, { $set: updateQuery }, { new: true })
        .select('-passwordHash -refreshToken')
        .exec();
    }

    return this.findSafeById(id);
  }
}
