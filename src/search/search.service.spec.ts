import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { GeminiService } from '../gemini/gemini.service';
import { QdrantService } from '../qdrant/qdrant.service';

describe('SearchService', () => {
  let service: SearchService;
  let geminiService: jest.Mocked<GeminiService>;
  let qdrantService: jest.Mocked<QdrantService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: GeminiService,
          useValue: {
            generateEmbedding: jest.fn(),
          },
        },
        {
          provide: QdrantService,
          useValue: {
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
    geminiService = module.get(GeminiService);
    qdrantService = module.get(QdrantService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate embedding and search Qdrant', async () => {
    const mockVector = [0.1, 0.2, 0.3];
    const mockResults = [{ id: 1, score: 0.95, payload: { title: 'NestJS' } }];

    geminiService.generateEmbedding.mockResolvedValueOnce(mockVector);
    qdrantService.search.mockResolvedValueOnce(mockResults);

    const result = await service.search('NestJS framework');

    expect(geminiService.generateEmbedding).toHaveBeenCalledWith('NestJS framework');
    expect(qdrantService.search).toHaveBeenCalledWith(mockVector, 10);
    expect(result).toEqual(mockResults);
  });
});
