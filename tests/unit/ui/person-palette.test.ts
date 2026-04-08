import { describe, expect, it } from 'vitest';
import { getPersonPalette } from '@/ui/components/person-palette';

describe('getPersonPalette', () => {
  it('keeps distinct watercolor washes and mists across the household palette set', () => {
    const palettes = Array.from({ length: 6 }, (_, index) =>
      getPersonPalette(index),
    );

    expect(new Set(palettes.map((palette) => palette.wash)).size).toBe(6);
    expect(new Set(palettes.map((palette) => palette.mist)).size).toBe(6);
  });
});
