import { Test, TestingModule } from '@nestjs/testing';
import { PlaylistsService } from './playlists.service';
import { getModelToken } from '@nestjs/mongoose';
import { Playlist } from '../../../schema/playlist.schema';
import { MetadataCacheService } from '../metadata/metadata-cache.service';

describe('PlaylistsService', () => {
  let service: PlaylistsService;

  const mockPlaylistModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    exec: jest.fn(),
  };

  const mockMetadataCacheService = {
    getOrFetch: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlaylistsService,
        {
          provide: getModelToken(Playlist.name),
          useValue: mockPlaylistModel,
        },
        {
          provide: MetadataCacheService,
          useValue: mockMetadataCacheService,
        }
      ],
    }).compile();

    service = module.get<PlaylistsService>(PlaylistsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
