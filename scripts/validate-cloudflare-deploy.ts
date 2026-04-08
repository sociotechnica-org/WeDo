import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(thisFilePath), '..');
const placeholderDatabaseId = '00000000-0000-0000-0000-000000000000';

type WranglerD1Database = {
  database_id?: string;
  preview_database_id?: string;
};

type WranglerConfig = {
  d1_databases?: WranglerD1Database[];
  workers_dev?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function parseWranglerConfig(content: string): WranglerConfig {
  const parsed = ts.parseConfigFileTextToJson('wrangler.jsonc', content);

  if (parsed.error) {
    throw new Error(ts.flattenDiagnosticMessageText(parsed.error.messageText, '\n'));
  }

  if (!isRecord(parsed.config)) {
    throw new Error('Expected wrangler.jsonc to parse to an object.');
  }

  const d1Databases = Array.isArray(parsed.config.d1_databases)
    ? parsed.config.d1_databases
        .filter(isRecord)
        .map((database) => ({
          database_id: toOptionalString(database.database_id),
          preview_database_id: toOptionalString(database.preview_database_id),
        }))
    : undefined;

  return {
    d1_databases: d1Databases,
    workers_dev:
      typeof parsed.config.workers_dev === 'boolean'
        ? parsed.config.workers_dev
        : undefined,
  };
}

function assertFileExists(
  relativePath: string,
  errors: string[],
  description: string,
) {
  if (!existsSync(join(repoRoot, relativePath))) {
    errors.push(`Missing ${description}: ${relativePath}`);
  }
}

function validateManifest(errors: string[]) {
  const manifestPath = join(repoRoot, 'public', 'manifest.webmanifest');

  if (!existsSync(manifestPath)) {
    errors.push('Missing PWA manifest: public/manifest.webmanifest');
    return;
  }

  let manifest: unknown;

  try {
    manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    errors.push(
      `Manifest is not valid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }

  if (!manifest || typeof manifest !== 'object') {
    errors.push('Manifest must parse to an object.');
    return;
  }

  const record = manifest as Record<string, unknown>;
  const icons = Array.isArray(record.icons) ? record.icons : [];

  if (record.display !== 'standalone') {
    errors.push('Manifest must set "display" to "standalone".');
  }

  if (record.start_url !== '/') {
    errors.push('Manifest must set "start_url" to "/".');
  }

  if (
    !icons.some(
      (icon) =>
        icon &&
        typeof icon === 'object' &&
        (icon as Record<string, unknown>).src === '/icons/icon-192.png',
    )
  ) {
    errors.push('Manifest must include /icons/icon-192.png.');
  }

  if (
    !icons.some(
      (icon) =>
        icon &&
        typeof icon === 'object' &&
        (icon as Record<string, unknown>).src === '/icons/icon-512.png',
    )
  ) {
    errors.push('Manifest must include /icons/icon-512.png.');
  }
}

function validateIndexHtml(errors: string[]) {
  const indexHtml = readFileSync(join(repoRoot, 'index.html'), 'utf8');

  if (
    !indexHtml.includes('rel="manifest"') ||
    !indexHtml.includes('/manifest.webmanifest')
  ) {
    errors.push(
      'index.html must link the web app manifest at /manifest.webmanifest.',
    );
  }

  if (
    !indexHtml.includes('rel="apple-touch-icon"') ||
    !indexHtml.includes('/icons/apple-touch-icon.png')
  ) {
    errors.push(
      'index.html must link the iPad install icon at /icons/apple-touch-icon.png.',
    );
  }

  if (!indexHtml.includes('name="theme-color"')) {
    errors.push('index.html must define a theme-color meta tag.');
  }
}

export function validateWranglerConfigContent(content: string): string[] {
  const errors: string[] = [];

  let wranglerConfig: WranglerConfig;

  try {
    wranglerConfig = parseWranglerConfig(content);
  } catch (error) {
    return [
      `wrangler.jsonc is not valid JSONC: ${error instanceof Error ? error.message : String(error)}`,
    ];
  }

  if (wranglerConfig.workers_dev !== true) {
    errors.push('wrangler.jsonc should explicitly enable workers.dev deploys.');
  }

  const d1Databases = wranglerConfig.d1_databases ?? [];

  if (d1Databases.length === 0) {
    errors.push(
      'wrangler.jsonc must define a top-level D1 database binding for production deploys.',
    );
    return errors;
  }

  d1Databases.forEach((database, index) => {
    if (database.database_id === placeholderDatabaseId) {
      errors.push(
        `wrangler.jsonc d1_databases[${index}].database_id still uses the placeholder D1 database ID.`,
      );
    }

    if (database.preview_database_id === placeholderDatabaseId) {
      errors.push(
        `wrangler.jsonc d1_databases[${index}].preview_database_id still uses the placeholder D1 database ID.`,
      );
    }
  });

  if (
    errors.some((error) =>
      error.includes('placeholder D1 database ID'),
    )
  ) {
    errors.push(
      [
        'Create the remote database with `npm exec wrangler -- d1 create we-do`,',
        'then replace the top-level `database_id` and `preview_database_id` entries before deploying.',
      ].join(' '),
    );
  }

  return errors;
}

function validateWranglerConfig(errors: string[]) {
  const wranglerConfig = readFileSync(join(repoRoot, 'wrangler.jsonc'), 'utf8');
  errors.push(...validateWranglerConfigContent(wranglerConfig));
}

function main() {
  const errors: string[] = [];

  validateWranglerConfig(errors);
  validateManifest(errors);
  validateIndexHtml(errors);

  assertFileExists('public/icons/icon-192.png', errors, 'manifest icon');
  assertFileExists('public/icons/icon-512.png', errors, 'manifest icon');
  assertFileExists(
    'public/icons/apple-touch-icon.png',
    errors,
    'Apple touch icon',
  );
  assertFileExists('public/favicon.svg', errors, 'favicon');

  if (errors.length > 0) {
    console.error('Cloudflare deployment validation failed:\n');

    for (const error of errors) {
      console.error(`- ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  process.stdout.write('Cloudflare deployment validation passed.\n');
}

if (process.argv[1] === thisFilePath) {
  main();
}
