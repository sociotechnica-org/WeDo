import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = path.resolve(process.cwd(), 'src');
const orderedLayers = [
  'types',
  'config',
  'db',
  'services',
  'workers',
  'realtime',
  'ui',
] as const;

type LayerName = (typeof orderedLayers)[number];

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const entryPath = path.join(directory, entry);
    const stats = statSync(entryPath);

    if (stats.isDirectory()) {
      return listSourceFiles(entryPath);
    }

    return /\.(ts|tsx)$/.test(entryPath) ? [entryPath] : [];
  });
}

function getLayerName(filePath: string): LayerName {
  const relativePath = path.relative(srcRoot, filePath);
  const firstSegment = relativePath.split(path.sep)[0];

  const layer = orderedLayers.find((candidate) => candidate === firstSegment);

  if (!layer) {
    throw new Error(`Unknown source layer for ${relativePath}.`);
  }

  return layer;
}

function resolveImportedLayer(
  importerPath: string,
  rawImportPath: string,
): LayerName | null {
  if (rawImportPath.startsWith('@/')) {
    const aliasTarget = rawImportPath.slice(2);
    const layer = aliasTarget.split('/')[0];

    return orderedLayers.find((candidate) => candidate === layer) ?? null;
  }

  if (!rawImportPath.startsWith('.')) {
    return null;
  }

  const resolvedPath = path.resolve(path.dirname(importerPath), rawImportPath);
  const relativePath = path.relative(srcRoot, resolvedPath);
  const layer = relativePath.split(path.sep)[0];

  return orderedLayers.find((candidate) => candidate === layer) ?? null;
}

function collectImportPaths(filePath: string): string[] {
  const source = readFileSync(filePath, 'utf8');
  const importRegex =
    /from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;

  const importPaths: string[] = [];
  let match: RegExpExecArray | null = importRegex.exec(source);

  while (match) {
    const [, fromPath, dynamicPath] = match;
    const importPath = fromPath ?? dynamicPath;

    if (importPath) {
      importPaths.push(importPath);
    }

    match = importRegex.exec(source);
  }

  return importPaths;
}

describe('layer boundaries', () => {
  it('keeps src imports flowing left to right only', () => {
    const violations: string[] = [];

    for (const filePath of listSourceFiles(srcRoot)) {
      const importerLayer = getLayerName(filePath);
      const importerIndex = orderedLayers.indexOf(importerLayer);

      for (const importPath of collectImportPaths(filePath)) {
        const importedLayer = resolveImportedLayer(filePath, importPath);

        if (!importedLayer) {
          continue;
        }

        const importedIndex = orderedLayers.indexOf(importedLayer);

        if (importedIndex > importerIndex) {
          violations.push(
            `${path.relative(process.cwd(), filePath)} imports ${importPath}`,
          );
        }
      }
    }

    expect(violations).toEqual([]);
  });
});
