import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { QdrantClient } from '@qdrant/js-client-rest';

dotenv.config();

const EMBEDDING_MODEL = 'gemini-embedding-001';
const COLLECTION_NAME =
  process.env.QDRANT_COLLECTION_NAME || 'rag_collection';
const QDRANT_HOST = process.env.QDRANT_HOST || 'localhost';
const QDRANT_PORT = parseInt(process.env.QDRANT_PORT || '6333', 10);
const VECTOR_SIZE = 3072;

interface DataItem {
  id: number;
  title: string;
  content: string;
  [key: string]: unknown;
}

async function ensureCollection(client: QdrantClient): Promise<void> {
  const collections = await client.getCollections();
  const exists = collections.collections.some((c) => c.name === COLLECTION_NAME);

  if (!exists) {
    await client.createCollection(COLLECTION_NAME, {
      vectors: {
        size: VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
    console.log(`Collection "${COLLECTION_NAME}" created.`);
  } else {
    console.log(`Collection "${COLLECTION_NAME}" already exists.`);
  }
}

async function seed(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set.');
  }

  const dataPath = path.resolve(__dirname, '..', 'data.json');
  if (!fs.existsSync(dataPath)) {
    throw new Error(`data.json not found at: ${dataPath}`);
  }

  const rawData = fs.readFileSync(dataPath, 'utf-8');
  const items: DataItem[] = JSON.parse(rawData);
  console.log(`Loaded ${items.length} items from data.json`);

  const genAI = new GoogleGenAI({ apiKey });
  const qdrant = new QdrantClient({ host: QDRANT_HOST, port: QDRANT_PORT });

  await ensureCollection(qdrant);

  for (const item of items) {
    const text = `${item.title}: ${item.content}`;
    console.log(`Generating embedding for: "${item.title}"...`);

    const response = await genAI.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: text,
    });

    const vector = response.embeddings[0].values;

    await qdrant.upsert(COLLECTION_NAME, {
      wait: true,
      points: [
        {
          id: item.id,
          vector,
          payload: { ...item },
        },
      ],
    });

    console.log(`  ✓ Upserted item id=${item.id}`);
  }

  console.log(`\nSeeding complete. ${items.length} items upserted into "${COLLECTION_NAME}".`);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
