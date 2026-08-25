import { Injectable, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Favorite, FavoriteDocument } from '../../../schema/favorite.schema';
import { AddFavoriteDto } from './dto/add-favorite.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectModel(Favorite.name) private readonly favoriteModel: Model<FavoriteDocument>,
  ) {}

  async addFavorite(userId: string, addFavoriteDto: AddFavoriteDto): Promise<FavoriteDocument> {
    const existing = await this.favoriteModel.findOne({
      userId: new Types.ObjectId(userId),
      trackId: addFavoriteDto.trackId,
      service: addFavoriteDto.service,
    });

    if (existing) {
      throw new ConflictException('Track is already in favorites');
    }

    const favorite = new this.favoriteModel({
      userId: new Types.ObjectId(userId),
      ...addFavoriteDto,
    });

    return favorite.save();
  }

  async removeFavorite(userId: string, trackId: string, service: string): Promise<void> {
    await this.favoriteModel
      .findOneAndDelete({
        userId: new Types.ObjectId(userId),
        trackId,
        service: service as any,
      })
      .exec();
  }

  async findAll(userId: string): Promise<FavoriteDocument[]> {
    return this.favoriteModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ addedAt: -1 })
      .exec();
  }
}
