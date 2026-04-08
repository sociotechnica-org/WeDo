import { seedCloudflareDatabase } from './seed-cloudflare';
import { fileURLToPath } from 'node:url';

const thisFilePath = fileURLToPath(import.meta.url);

export async function seedLocalDatabase(): Promise<void> {
  await seedCloudflareDatabase('local');
}

if (process.argv[1] === thisFilePath) {
  void seedLocalDatabase().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
}
