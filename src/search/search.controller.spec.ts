import { Test, TestingModule } from '@nestjs/testing';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { BadRequestException } from '@nestjs/common';

describe('SearchController', () => {
  let controller: SearchController;
  let searchService: jest.Mocked<SearchService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SearchController],
      providers: [
        {
          provide: SearchService,
          useValue: {
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<SearchController>(SearchController);
    searchService = module.get(SearchService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call searchService.search with trimmed query', async () => {
    const mockResults = [{ id: 1, score: 0.9, payload: { title: 'Test' } }];
    searchService.search.mockResolvedValueOnce(mockResults);

    const result = await controller.search('  NestJS  ');
    expect(result).toEqual(mockResults);
    expect(searchService.search).toHaveBeenCalledWith('NestJS');
  });

  it('should throw BadRequestException when query is empty', async () => {
    await expect(controller.search('')).rejects.toThrow(BadRequestException);
  });

  it('should throw BadRequestException when query is only whitespace', async () => {
    await expect(controller.search('   ')).rejects.toThrow(BadRequestException);
  });
});
