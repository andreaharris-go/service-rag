import { Module } from '@nestjs/common';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { GeminiModule } from '../gemini/gemini.module';
import { QdrantModule } from '../qdrant/qdrant.module';

@Module({
  imports: [GeminiModule, QdrantModule],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
