import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Playlist, PlaylistDocument } from '../../../schema/playlist.schema';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTrackDto } from './dto/add-track.dto';
import { ReorderTracksDto } from './dto/reorder-tracks.dto';
import { MetadataCacheService } from '../metadata/metadata-cache.service';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private readonly playlistModel: Model<PlaylistDocument>,
    private readonly metadataCacheService: MetadataCacheService,
  ) {}

  async create(userId: string, createDto: CreatePlaylistDto): Promise<PlaylistDocument> {
    const newPlaylist = new this.playlistModel({
      userId: new Types.ObjectId(userId),
      ...createDto,
    });
    return newPlaylist.save();
  }

  async findAllForUser(userId: string): Promise<PlaylistDocument[]> {
    return this.playlistModel.find({
      $or: [
        { userId: new Types.ObjectId(userId) },
        { isPublic: true }
      ]
    }).exec();
  }

  async findOne(id: string): Promise<PlaylistDocument | null> {
    return this.playlistModel.findById(id).exec();
  }

  async update(id: string, updateDto: UpdatePlaylistDto): Promise<PlaylistDocument | null> {
    return this.playlistModel.findByIdAndUpdate(id, updateDto, { new: true }).exec();
  }

  async remove(id: string): Promise<void> {
    await this.playlistModel.findByIdAndDelete(id).exec();
  }

  async addTrack(playlistId: string, userId: string, trackDto: AddTrackDto): Promise<PlaylistDocument | null> {
    // Enrich metadata cache
    await this.metadataCacheService.enrich({
      trackId: trackDto.trackId,
      service: trackDto.service,
      title: trackDto.title,
      artist: trackDto.artist,
      albumArt: trackDto.albumArt,
      duration: trackDto.duration,
    });

    return this.playlistModel.findByIdAndUpdate(
      playlistId,
      {
        $push: {
          tracks: {
            ...trackDto,
            addedBy: new Types.ObjectId(userId),
            addedAt: new Date(),
          },
        },
      },
      { new: true }
    ).exec();
  }

  async removeTrack(playlistId: string, trackId: string): Promise<PlaylistDocument | null> {
    return this.playlistModel.findByIdAndUpdate(
      playlistId,
      {
        $pull: {
          tracks: { trackId },
        },
      },
      { new: true }
    ).exec();
  }

  async reorderTracks(playlistId: string, reorderDto: ReorderTracksDto): Promise<PlaylistDocument | null> {
    const playlist = await this.playlistModel.findById(playlistId).exec();
    if (!playlist) return null;

    const tracks = playlist.tracks;
    if (reorderDto.oldIndex < 0 || reorderDto.oldIndex >= tracks.length ||
        reorderDto.newIndex < 0 || reorderDto.newIndex >= tracks.length) {
      return playlist;
    }

    const [movedTrack] = tracks.splice(reorderDto.oldIndex, 1);
    tracks.splice(reorderDto.newIndex, 0, movedTrack);

    playlist.tracks = tracks;
    return playlist.save();
  }
}
