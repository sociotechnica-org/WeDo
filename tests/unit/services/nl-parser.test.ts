import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  NlTaskParserError,
  parseNaturalLanguageTask,
} from '@/services/nl-parser';

describe('nl-parser service', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls the Anthropic Messages API and returns the validated tool input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          stop_reason: 'tool_use',
          content: [
            {
              type: 'tool_use',
              id: 'toolu_123',
              name: 'create_task',
              input: {
                title: 'Practice piano',
                emoji: '🎹',
                schedule_rules: {
                  days: ['MO', 'TU', 'TH', 'FR'],
                },
              },
            },
          ],
        }),
        {
          status: 200,
          headers: {
            'content-type': 'application/json',
          },
        },
      ),
    );

    vi.stubGlobal('fetch', fetchMock);

    await expect(
      parseNaturalLanguageTask(
        {
          mode: 'live',
          apiKey: 'test-api-key',
        },
        'practice piano Monday Tuesday Thursday Friday',
      ),
    ).resolves.toEqual({
      title: 'Practice piano',
      emoji: '🎹',
      schedule_rules: {
        days: ['MO', 'TU', 'TH', 'FR'],
      },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'x-api-key': 'test-api-key',
        }),
      }),
    );

    const request = fetchMock.mock.calls[0]?.[1];

    expect(request).toBeDefined();

    const body = JSON.parse((request as RequestInit).body as string) as {
      model: string;
      tool_choice: { type: string; name: string };
      tools: Array<Record<string, unknown>>;
    };

    expect(body.model).toBe('claude-sonnet-4-6');
    expect(body.tool_choice).toEqual({
      type: 'tool',
      name: 'create_task',
    });
    expect(body.tools[0]).not.toHaveProperty('strict');
  });

  it('rejects non-tool Anthropic responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            stop_reason: 'end_turn',
            content: [
              {
                type: 'text',
                text: 'Practice piano on weekdays.',
              },
            ],
          }),
          {
            status: 200,
            headers: {
              'content-type': 'application/json',
            },
          },
        ),
      ),
    );

    await expect(
      parseNaturalLanguageTask(
        {
          mode: 'live',
          apiKey: 'test-api-key',
        },
        'practice piano weekdays',
      ),
    ).rejects.toThrow(NlTaskParserError);
  });

  it('surfaces Anthropic HTTP failures with status context', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('upstream unavailable', {
          status: 503,
        }),
      ),
    );

    await expect(
      parseNaturalLanguageTask(
        {
          mode: 'live',
          apiKey: 'test-api-key',
        },
        'practice piano weekdays',
      ),
    ).rejects.toThrow('Anthropic task parsing failed with 503');
  });

  it('supports the local stub parser mode for deterministic e2e task creation', async () => {
    await expect(
      parseNaturalLanguageTask(
        {
          mode: 'stub',
        },
        'practice piano every day',
      ),
    ).resolves.toEqual({
      title: 'Practice piano',
      emoji: '🎹',
      schedule_rules: {
        days: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
      },
    });
  });
});
