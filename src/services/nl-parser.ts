import { z } from 'zod';
import { parsedTaskSchema, type ParsedTask } from '@/types';

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

function getCreateTaskTool() {
  return {
    name: toolName,
    description:
      'Create a recurring household task from natural-language text with a concise title, single emoji, and RFC 5545 day-code schedule.',
    strict: true,
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

export async function parseNaturalLanguageTask(
  apiKey: string,
  rawInput: string,
): Promise<ParsedTask> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'anthropic-version': anthropicVersion,
      'content-type': 'application/json',
      'x-api-key': apiKey,
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
