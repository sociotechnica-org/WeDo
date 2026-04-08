import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

export type DatabaseClient = Parameters<typeof drizzle>[0];

export function getDatabase(client: DatabaseClient) {
  return drizzle(client, { schema });
}
