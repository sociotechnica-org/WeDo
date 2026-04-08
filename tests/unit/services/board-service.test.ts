import { describe, expect, it } from 'vitest';
import { getBoardResponse, getBoardSnapshot } from '@/services/board-service';

describe('board-service', () => {
  it('hydrates the scaffold board with the configured household name', () => {
    const board = getBoardSnapshot({
      HOUSEHOLD_NAME: 'River House',
    });

    expect(board.householdName).toBe('River House');
    expect(board.columns).toHaveLength(3);
  });

  it('returns a schema-safe response envelope', () => {
    const response = getBoardResponse({});

    expect(response.board.dayLabel).toBe('Tuesday, April 7');
    expect(response.board.columns[0]?.tasks[0]?.title).toBe('Breakfast table');
  });
});
