import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { GeminiModule } from './gemini/gemini.module';
import { QdrantModule } from './qdrant/qdrant.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    GeminiModule,
    QdrantModule,
    SearchModule,
  ],
})
export class AppModule {}
