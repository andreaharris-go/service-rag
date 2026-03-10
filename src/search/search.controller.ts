import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SearchService } from './search.service';
import { QdrantSearchResult } from '../qdrant/qdrant.service';

@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('search')
  async search(
    @Query('q') query: string,
  ): Promise<QdrantSearchResult[]> {
    if (!query || query.trim().length === 0) {
      throw new BadRequestException('Query parameter "q" is required.');
    }
    return this.searchService.search(query.trim());
  }
}
