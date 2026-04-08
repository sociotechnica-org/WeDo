import type { TaskParserConfig } from '@/config/runtime';
import { z } from 'zod';
import {
  parsedTaskSchema,
  type DayCode,
  type ParsedTask,
} from '@/types';

const anthropicMessageResponseSchema = z
  .object({
    stop_reason: z.string().nullable(),
    content: z.array(
      z.discriminatedUnion('type', [
        z
          .object({
            type: z.literal('text'),
            text: z.string(),
          })
          .passthrough(),
        z
          .object({
            type: z.literal('tool_use'),
            id: z.string(),
            name: z.string(),
            input: z.unknown(),
          })
          .passthrough(),
      ]),
    ),
  })
  .passthrough();

const toolName = 'create_task';
const anthropicVersion = '2023-06-01';
const anthropicModel = 'claude-sonnet-4-6';

export class NlTaskParserError extends Error {}

const weekdayDayCodes = ['MO', 'TU', 'WE', 'TH', 'FR'] satisfies DayCode[];
const allDayCodes = [
  'MO',
  'TU',
  'WE',
  'TH',
  'FR',
  'SA',
  'SU',
] satisfies DayCode[];

const namedDayMatchers = [
  ['MO', /\b(?:monday|mondays|mon)\b/],
  ['TU', /\b(?:tuesday|tuesdays|tue|tues)\b/],
  ['WE', /\b(?:wednesday|wednesdays|wed)\b/],
  ['TH', /\b(?:thursday|thursdays|thu|thurs)\b/],
  ['FR', /\b(?:friday|fridays|fri)\b/],
  ['SA', /\b(?:saturday|saturdays|sat)\b/],
  ['SU', /\b(?:sunday|sundays|sun)\b/],
] satisfies ReadonlyArray<readonly [DayCode, RegExp]>;

const scheduledDayWordsPattern =
  /\b(?:monday|mondays|mon|tuesday|tuesdays|tue|tues|wednesday|wednesdays|wed|thursday|thursdays|thu|thurs|friday|fridays|fri|saturday|saturdays|sat|sunday|sundays|sun)\b/g;

function getCreateTaskTool() {
  return {
    name: toolName,
    description:
      'Create a recurring household task from natural-language text with a concise title, single emoji, and RFC 5545 day-code schedule.',
    input_schema: {
      type: 'object',
      additionalProperties: false,
      required: ['title', 'emoji', 'schedule_rules'],
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          description:
            'A concise display title for the task without recurrence words.',
        },
        emoji: {
          type: 'string',
          minLength: 1,
          description: 'A single emoji that fits the task.',
        },
        schedule_rules: {
          type: 'object',
          additionalProperties: false,
          required: ['days'],
          properties: {
            days: {
              type: 'array',
              minItems: 1,
              maxItems: 7,
              items: {
                type: 'string',
                enum: ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'],
              },
              description:
                'Unique RFC 5545 BYDAY day codes for when the task recurs.',
            },
          },
        },
      },
    },
  } as const;
}

function getToolUseContent(rawInput: string) {
  return [
    {
      role: 'user',
      content: `Convert this recurring household task into a structured task record: ${rawInput}`,
    },
  ] as const;
}

function getSystemPrompt() {
  return [
    'You parse recurring household task descriptions into structured task data.',
    'Always call the create_task tool exactly once.',
    'Make a reasonable best guess for ambiguous recurring language instead of asking a follow-up question.',
    'Use concise natural task titles without schedule words.',
    'Choose one fitting emoji.',
    'Return RFC 5545 day codes in schedule_rules.days.',
    'If the user says every day, include all seven day codes. Sunday visibility is handled elsewhere.',
  ].join(' ');
}

function getToolInputFromResponse(payload: unknown): ParsedTask {
  const response = anthropicMessageResponseSchema.parse(payload);
  const toolUse = response.content.find(
    (block) => block.type === 'tool_use' && block.name === toolName,
  );

  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new NlTaskParserError(
      `Anthropic response did not include the ${toolName} tool call.`,
    );
  }

  return parsedTaskSchema.parse(toolUse.input);
}

function toDisplayTitle(value: string): string {
  const normalizedValue = value.trim();

  if (normalizedValue.length === 0) {
    return normalizedValue;
  }

  return `${normalizedValue[0]?.toUpperCase() ?? ''}${normalizedValue.slice(1)}`;
}

function inferTaskEmoji(rawInput: string): string {
  const emojiHints = [
    { emoji: '🎹', pattern: /\bpiano\b/ },
    { emoji: '🍽️', pattern: /\b(?:kitchen|dish(?:es)?|dinner)\b/ },
    { emoji: '🧺', pattern: /\blaundry\b/ },
    { emoji: '🧹', pattern: /\b(?:vacuum|sweep|sweeping)\b/ },
    { emoji: '📚', pattern: /\b(?:homework|study|schoolwork|reading)\b/ },
    { emoji: '🧼', pattern: /\b(?:clean|cleanup|reset)\b/ },
  ] as const;

  const matchingHint = emojiHints.find(({ pattern }) => pattern.test(rawInput));

  return matchingHint?.emoji ?? '📝';
}

function inferTaskTitle(rawInput: string): string {
  const withoutScheduleWords = rawInput
    .replace(
      /\bon(?=\s+(?:every day|daily|weekdays|each|monday|mondays|mon|tuesday|tuesdays|tue|tues|wednesday|wednesdays|wed|thursday|thursdays|thu|thurs|friday|fridays|fri|saturday|saturdays|sat|sunday|sundays|sun)\b)/g,
      ' ',
    )
    .replace(/\b(?:every day|daily|weekdays|each)\b/g, ' ')
    .replace(scheduledDayWordsPattern, ' ')
    .replace(/[,&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return toDisplayTitle(withoutScheduleWords || rawInput.trim());
}

function inferScheduleDays(rawInput: string): DayCode[] {
  if (/\b(?:every day|daily)\b/.test(rawInput)) {
    return [...allDayCodes];
  }

  if (/\bweekdays\b/.test(rawInput)) {
    return [...weekdayDayCodes];
  }

  const detectedDays = namedDayMatchers
    .filter(([, pattern]) => pattern.test(rawInput))
    .map(([dayCode]) => dayCode);

  if (detectedDays.length === 0) {
    throw new NlTaskParserError(
      'Stub task parser could not infer schedule days from the local e2e input.',
    );
  }

  return detectedDays;
}

function parseStubNaturalLanguageTask(rawInput: string): ParsedTask {
  const normalizedInput = rawInput.trim().toLowerCase();

  return parsedTaskSchema.parse({
    title: inferTaskTitle(normalizedInput),
    emoji: inferTaskEmoji(normalizedInput),
    schedule_rules: {
      days: inferScheduleDays(normalizedInput),
    },
  });
}

export async function parseNaturalLanguageTask(
  config: TaskParserConfig,
  rawInput: string,
): Promise<ParsedTask> {
  if (config.mode === 'stub') {
    return parseStubNaturalLanguageTask(rawInput);
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': anthropicVersion,
      'content-type': 'application/json',
      'x-api-key': config.apiKey,
    },
    body: JSON.stringify({
      model: anthropicModel,
      max_tokens: 512,
      system: getSystemPrompt(),
      tool_choice: {
        type: 'tool',
        name: toolName,
      },
      tools: [getCreateTaskTool()],
      messages: getToolUseContent(rawInput),
    }),
  });

  if (!response.ok) {
    const bodyText = await response.text();

    throw new NlTaskParserError(
      `Anthropic task parsing failed with ${response.status}: ${bodyText || 'No response body.'}`,
    );
  }

  return getToolInputFromResponse((await response.json()) as unknown);
}
