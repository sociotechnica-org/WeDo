import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  out: './src/db/migrations',
  schema: './src/db/schema.ts',
  strict: true,
  verbose: true,
});
