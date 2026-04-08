import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const thisFilePath = fileURLToPath(import.meta.url);
const repoRoot = join(dirname(thisFilePath), '..');
const placeholderDatabaseId = '00000000-0000-0000-0000-000000000000';

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

function validateWranglerConfig(errors: string[]) {
  const wranglerConfig = readFileSync(join(repoRoot, 'wrangler.jsonc'), 'utf8');

  if (wranglerConfig.includes(placeholderDatabaseId)) {
    errors.push(
      [
        'wrangler.jsonc still contains placeholder D1 database IDs.',
        'Create the remote database with `npm exec wrangler -- d1 create we-do`,',
        'then replace both `database_id` and `preview_database_id` entries before deploying.',
      ].join(' '),
    );
  }

  if (!wranglerConfig.includes('"workers_dev": true')) {
    errors.push('wrangler.jsonc should explicitly enable workers.dev deploys.');
  }
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

main();
