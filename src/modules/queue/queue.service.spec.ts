import { Test, TestingModule } from '@nestjs/testing';
import { QueueService } from './queue.service';
import { getModelToken } from '@nestjs/mongoose';
import { Queue } from '../../../schema/queue.schema';

describe('QueueService', () => {
  let service: QueueService;

  const mockQueueModel = {
    find: jest.fn(),
    findOne: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueService,
        {
          provide: getModelToken(Queue.name),
          useValue: mockQueueModel,
        },
      ],
    }).compile();

    service = module.get<QueueService>(QueueService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
