import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PlaylistsService } from '../playlists.service';

@Injectable()
export class PlaylistOwnerGuard implements CanActivate {
  constructor(private playlistsService: PlaylistsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const playlistId = request.params.id;

    if (!user || !playlistId) {
      return false;
    }

    const playlist = await this.playlistsService.findOne(playlistId);
    if (!playlist) {
      throw new NotFoundException('Playlist not found');
    }

    if (playlist.userId.toString() !== user._id.toString()) {
      throw new ForbiddenException('You do not own this playlist');
    }

    // Attach playlist to request so controller doesn't need to fetch it again
    request.playlist = playlist;
    return true;
  }
}
