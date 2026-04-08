import { describe, expect, it } from 'vitest';
import {
  parseWranglerConfig,
  validateWranglerConfigContent,
} from '../../../scripts/validate-cloudflare-deploy';

describe('validate cloudflare deploy wrangler config', () => {
  it('parses jsonc config content instead of relying on raw substring checks', () => {
    const config = parseWranglerConfig(`{
      // production deploys stay on workers.dev for now
      "workers_dev": true,
      "d1_databases": [
        {
          "binding": "DB",
          "database_id": "11111111-1111-1111-1111-111111111111",
          "preview_database_id": "22222222-2222-2222-2222-222222222222",
        },
      ],
    }`);

    expect(config.workers_dev).toBe(true);
    expect(config.d1_databases).toEqual([
      {
        database_id: '11111111-1111-1111-1111-111111111111',
        preview_database_id: '22222222-2222-2222-2222-222222222222',
      },
    ]);
  });

  it('validates only the top-level production D1 binding', () => {
    const errors = validateWranglerConfigContent(`{
      "workers_dev": true,
      "d1_databases": [
        {
          "binding": "DB",
          "database_id": "11111111-1111-1111-1111-111111111111",
          "preview_database_id": "22222222-2222-2222-2222-222222222222",
        },
      ],
      "env": {
        "e2e": {
          "d1_databases": [
            {
              "binding": "DB",
              "database_id": "00000000-0000-0000-0000-000000000000",
              "preview_database_id": "00000000-0000-0000-0000-000000000000",
            },
          ],
        },
      },
    }`);

    expect(errors).toEqual([]);
  });

  it('fails when the production binding still uses placeholder IDs', () => {
    const errors = validateWranglerConfigContent(`{
      "workers_dev": true,
      "d1_databases": [
        {
          "binding": "DB",
          "database_id": "00000000-0000-0000-0000-000000000000",
          "preview_database_id": "00000000-0000-0000-0000-000000000000",
        },
      ],
    }`);

    expect(errors).toContain(
      'wrangler.jsonc d1_databases[0].database_id still uses the placeholder D1 database ID.',
    );
    expect(errors).toContain(
      'wrangler.jsonc d1_databases[0].preview_database_id still uses the placeholder D1 database ID.',
    );
  });
});
