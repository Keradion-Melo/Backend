import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Queue, QueueDocument } from '../../../schema/queue.schema';
import { AddQueueTrackDto } from './dto/add-track.dto';
import { UpdateCurrentDto } from './dto/update-current.dto';
import { SyncQueueDto } from './dto/sync-queue.dto';

@Injectable()
export class QueueService {
  constructor(
    @InjectModel(Queue.name) private readonly queueModel: Model<QueueDocument>,
  ) { }

  async getQueue(userId: string, sessionId: string): Promise<QueueDocument> {
    let queue = await this.queueModel.findOne({ userId: new Types.ObjectId(userId), sessionId }).exec();

    if (!queue) {
      queue = new this.queueModel({
        userId: new Types.ObjectId(userId),
        sessionId,
        tracks: [],
        currentIndex: -1,
        status: 'stopped',
        currentTime: 0,
      });
      await queue.save();
    }

    return queue;
  }

  async addTrack(userId: string, sessionId: string, trackDto: AddQueueTrackDto): Promise<QueueDocument> {
    const queue = await this.getQueue(userId, sessionId);

    const newPosition = queue.tracks.length > 0
      ? Math.max(...queue.tracks.map(t => t.position)) + 1
      : 0;

    const trackObj = {
      trackId: trackDto.trackId,
      service: trackDto.service,
      title: trackDto.title,
      artist: trackDto.artist,
      albumArt: trackDto.albumArt || '',
      duration: trackDto.duration,
      requestedBy: new Types.ObjectId(userId),
      position: newPosition,
    };

    queue.tracks.push(trackObj);
    return queue.save();
  }

  async removeTrack(userId: string, sessionId: string, position: number): Promise<QueueDocument> {
    const queue = await this.getQueue(userId, sessionId);

    queue.tracks = queue.tracks.filter(t => t.position !== position);

    // adjust currentIndex if necessary
    if (queue.currentIndex >= queue.tracks.length) {
      queue.currentIndex = Math.max(-1, queue.tracks.length - 1);
    }

    return queue.save();
  }

  async reorderTracks(userId: string, sessionId: string, order: number[]): Promise<QueueDocument> {
    const queue = await this.getQueue(userId, sessionId);

    // order array contains the new order of positions
    // e.g. if order is [2, 0, 1], the track at old position 2 becomes position 0, etc.
    const reorderedTracks = [];
    for (let i = 0; i < order.length; i++) {
      const pos = order[i];
      const track = queue.tracks.find(t => t.position === pos);
      if (track) {
        reorderedTracks.push({ ...track, position: i }); // assign new position
      }
    }

    // For tracks that were not in the order array, append them at the end
    const trackIdsInOrder = new Set(order);
    let nextPos = reorderedTracks.length;
    for (const track of queue.tracks) {
      if (!trackIdsInOrder.has(track.position)) {
        reorderedTracks.push({ ...track, position: nextPos++ });
      }
    }

    queue.tracks = reorderedTracks;
    return queue.save();
  }

  async updateCurrent(userId: string, sessionId: string, updateDto: UpdateCurrentDto): Promise<QueueDocument> {
    const queue = await this.getQueue(userId, sessionId);

    if (updateDto.currentIndex !== undefined) queue.currentIndex = updateDto.currentIndex;
    if (updateDto.status !== undefined) queue.status = updateDto.status;
    if (updateDto.currentTime !== undefined) queue.currentTime = updateDto.currentTime;

    return queue.save();
  }

  async clearQueue(userId: string, sessionId: string): Promise<QueueDocument> {
    const queue = await this.getQueue(userId, sessionId);
    queue.tracks = [];
    queue.currentIndex = -1;
    queue.status = 'stopped';
    queue.currentTime = 0;
    return queue.save();
  }

  async syncQueue(userId: string, sessionId: string, syncDto: SyncQueueDto): Promise<QueueDocument> {
    const queue = await this.getQueue(userId, sessionId);

    queue.tracks = syncDto.tracks.map((t, index) => ({
      trackId: t.trackId,
      service: t.service,
      title: t.title,
      artist: t.artist,
      albumArt: t.albumArt || '',
      duration: t.duration,
      requestedBy: new Types.ObjectId(userId),
      position: index,
    }));

    // adjust current index if it exceeds new length
    if (queue.currentIndex >= queue.tracks.length) {
      queue.currentIndex = Math.max(-1, queue.tracks.length - 1);
    }

    return queue.save();
  }
}
