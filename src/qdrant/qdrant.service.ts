import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface QdrantPoint {
  id: number | string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface QdrantSearchResult {
  id: number | string;
  score: number;
  payload: Record<string, unknown>;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private client: QdrantClient;
  private collectionName: string;
  private readonly vectorSize = 3072;

  constructor(private readonly configService: ConfigService) {
    const host = this.configService.get<string>('qdrant.host');
    const port = this.configService.get<number>('qdrant.port');
    this.collectionName =
      this.configService.get<string>('qdrant.collectionName') ??
      'rag_collection';
    this.client = new QdrantClient({ host, port });
  }

  async onModuleInit() {
    await this.ensureCollection();
  }

  async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
        this.logger.log(`Collection "${this.collectionName}" created.`);
      } else {
        this.logger.log(`Collection "${this.collectionName}" already exists.`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure Qdrant collection', error);
      throw error;
    }
  }

  async upsertPoints(points: QdrantPoint[]): Promise<void> {
    await this.client.upsert(this.collectionName, {
      wait: true,
      points: points.map((p) => ({
        id: p.id,
        vector: p.vector,
        payload: p.payload,
      })),
    });
    this.logger.log(`Upserted ${points.length} point(s) into "${this.collectionName}".`);
  }

  async search(
    vector: number[],
    limit = 10,
  ): Promise<QdrantSearchResult[]> {
    const results = await this.client.search(this.collectionName, {
      vector,
      limit,
      with_payload: true,
    });

    return results.map((r) => ({
      id: r.id,
      score: r.score,
      payload: r.payload as Record<string, unknown>,
    }));
  }

  getClient(): QdrantClient {
    return this.client;
  }

  getCollectionName(): string {
    return this.collectionName;
  }
}
