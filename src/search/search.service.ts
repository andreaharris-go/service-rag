import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { QdrantService, QdrantSearchResult } from '../qdrant/qdrant.service';

const SEARCH_LIMIT = 10;

@Injectable()
export class SearchService {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly qdrantService: QdrantService,
  ) {}

  async search(query: string): Promise<QdrantSearchResult[]> {
    const embedding = await this.geminiService.generateEmbedding(query);
    return this.qdrantService.search(embedding, SEARCH_LIMIT);
  }
}
