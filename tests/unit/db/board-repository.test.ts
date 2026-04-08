import { describe, expect, it, vi } from 'vitest';
import { getPrimaryFamilyId } from '@/db/board-repository';

describe('board-repository', () => {
  it('derives the first known family id across family-scoped tables', async () => {
    const first = vi.fn().mockResolvedValue({
      family_id: 'family-maple',
    });
    const prepare = vi.fn().mockReturnValue({
      first,
    });

    await expect(getPrimaryFamilyId({ prepare } as never)).resolves.toBe(
      'family-maple',
    );
    expect(prepare).toHaveBeenCalledTimes(1);
    expect(prepare.mock.calls[0]?.[0]).toContain('select family_id from persons');
    expect(prepare.mock.calls[0]?.[0]).toContain('select family_id from tasks');
    expect(prepare.mock.calls[0]?.[0]).toContain(
      'select family_id from skip_days',
    );
  });

  it('returns null when no family-scoped rows exist yet', async () => {
    const prepare = vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
    });

    await expect(getPrimaryFamilyId({ prepare } as never)).resolves.toBeNull();
  });
});
