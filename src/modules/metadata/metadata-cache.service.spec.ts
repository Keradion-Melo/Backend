import { Test, TestingModule } from '@nestjs/testing';
import { MetadataCacheService } from './metadata-cache.service';
import { getModelToken } from '@nestjs/mongoose';
import { MetadataCache } from '../../../schema/metadata-cache.schema';
import { StreamingServiceFactory } from '../streaming/streaming-service.factory';

describe('MetadataCacheService', () => {
  let service: MetadataCacheService;

  const mockMetadataModel = {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
    exec: jest.fn(),
  };

  const mockStreamingFactory = {
    getService: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetadataCacheService,
        {
          provide: getModelToken(MetadataCache.name),
          useValue: mockMetadataModel,
        },
        {
          provide: StreamingServiceFactory,
          useValue: mockStreamingFactory,
        },
      ],
    }).compile();

    service = module.get<MetadataCacheService>(MetadataCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
