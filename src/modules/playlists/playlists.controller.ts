import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ForbiddenException, NotFoundException, Put } from '@nestjs/common';
import { PlaylistsService } from './playlists.service';
import { CreatePlaylistDto } from './dto/create-playlist.dto';
import { UpdatePlaylistDto } from './dto/update-playlist.dto';
import { AddTrackDto } from './dto/add-track.dto';
import { ReorderTracksDto } from './dto/reorder-tracks.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlaylistOwnerGuard } from './guards/playlist-owner.guard';

@UseGuards(JwtAuthGuard)
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Post()
  create(@Request() req, @Body() createPlaylistDto: CreatePlaylistDto) {
    return this.playlistsService.create(req.user._id, createPlaylistDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.playlistsService.findAllForUser(req.user._id);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const playlist = await this.playlistsService.findOne(id);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    if (playlist.userId.toString() !== req.user._id.toString() && !playlist.isPublic && !playlist.isCollaborative) {
      throw new ForbiddenException('Access denied');
    }
    return playlist;
  }

  @UseGuards(PlaylistOwnerGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePlaylistDto: UpdatePlaylistDto) {
    return this.playlistsService.update(id, updatePlaylistDto);
  }

  @UseGuards(PlaylistOwnerGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.playlistsService.remove(id);
  }

  @Post(':id/tracks')
  async addTrack(@Request() req, @Param('id') id: string, @Body() addTrackDto: AddTrackDto) {
    const playlist = await this.playlistsService.findOne(id);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    
    const isOwner = playlist.userId.toString() === req.user._id.toString();
    if (!isOwner && !playlist.isCollaborative) {
      throw new ForbiddenException('You cannot add tracks to this playlist');
    }
    
    return this.playlistsService.addTrack(id, req.user._id, addTrackDto);
  }

  @Delete(':id/tracks/:trackId')
  async removeTrack(@Request() req, @Param('id') id: string, @Param('trackId') trackId: string) {
    const playlist = await this.playlistsService.findOne(id);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    
    const isOwner = playlist.userId.toString() === req.user._id.toString();
    if (!isOwner && !playlist.isCollaborative) {
      throw new ForbiddenException('You cannot remove tracks from this playlist');
    }

    return this.playlistsService.removeTrack(id, trackId);
  }

  @Put(':id/tracks/reorder')
  async reorderTracks(@Request() req, @Param('id') id: string, @Body() reorderTracksDto: ReorderTracksDto) {
    const playlist = await this.playlistsService.findOne(id);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }
    
    const isOwner = playlist.userId.toString() === req.user._id.toString();
    if (!isOwner && !playlist.isCollaborative) {
      throw new ForbiddenException('You cannot reorder tracks in this playlist');
    }

    return this.playlistsService.reorderTracks(id, reorderTracksDto);
  }
}
