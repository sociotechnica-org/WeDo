import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../../..',
);

describe('pwa shell assets', () => {
  it('links the manifest and iPad install icon from index.html', () => {
    const indexHtml = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');

    expect(indexHtml).toContain('rel="manifest"');
    expect(indexHtml).toContain('/manifest.webmanifest');
    expect(indexHtml).toContain('rel="apple-touch-icon"');
    expect(indexHtml).toContain('/icons/apple-touch-icon.png');
    expect(indexHtml).toContain('name="theme-color"');
    expect(indexHtml).toContain('name="apple-mobile-web-app-title"');
  });

  it('defines a standalone manifest with installable icons', () => {
    const manifest = JSON.parse(
      readFileSync(resolve(projectRoot, 'public/manifest.webmanifest'), 'utf8'),
    ) as {
      display: string;
      icons: Array<{ src: string; sizes: string; type: string }>;
      orientation: string;
      scope: string;
      start_url: string;
    };

    expect(manifest.display).toBe('standalone');
    expect(manifest.start_url).toBe('/');
    expect(manifest.scope).toBe('/');
    expect(manifest.orientation).toBe('landscape');
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          src: '/icons/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
        }),
        expect.objectContaining({
          src: '/icons/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
        }),
      ]),
    );
  });

  it('ships the static icon assets required by the manifest', () => {
    expect(existsSync(resolve(projectRoot, 'public/favicon.svg'))).toBe(true);
    expect(existsSync(resolve(projectRoot, 'public/icons/icon-192.png'))).toBe(
      true,
    );
    expect(existsSync(resolve(projectRoot, 'public/icons/icon-512.png'))).toBe(
      true,
    );
    expect(
      existsSync(resolve(projectRoot, 'public/icons/apple-touch-icon.png')),
    ).toBe(true);
  });
});
