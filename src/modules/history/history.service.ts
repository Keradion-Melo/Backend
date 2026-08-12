import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { History, HistoryDocument } from '../../../schema/history.schema';

export interface TrackInput {
  trackId: string;
  service: 'jamendo' | 'youtube';
  title: string;
  artist: string;
  albumArt?: string;
}

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(
    @InjectModel(History.name) private readonly historyModel: Model<HistoryDocument>,
  ) {}

  async recordPlay(userId: string, trackInput: TrackInput, durationPlayed: number, totalDuration: number): Promise<HistoryDocument> {
    const historyEntry = new this.historyModel({
      userId: new Types.ObjectId(userId),
      ...trackInput,
      duration: durationPlayed,
      totalDuration,
      playedAt: new Date(),
    });
    return historyEntry.save();
  }

  async getRecentHistory(userId: string, limit = 20, offset = 0): Promise<HistoryDocument[]> {
    return this.historyModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ playedAt: -1 })
      .skip(offset)
      .limit(limit)
      .exec();
  }

  async clearHistory(userId: string): Promise<void> {
    await this.historyModel.deleteMany({ userId: new Types.ObjectId(userId) }).exec();
  }

  async removeHistoryEntry(userId: string, id: string): Promise<void> {
    await this.historyModel.findOneAndDelete({
      _id: new Types.ObjectId(id),
      userId: new Types.ObjectId(userId),
    }).exec();
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron() {
    this.logger.debug('Running scheduled task: delete history older than 30 days');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.historyModel.deleteMany({
      playedAt: { $lt: thirtyDaysAgo },
    }).exec();
    
    this.logger.debug(`Deleted ${result.deletedCount} old history entries`);
  }
}
