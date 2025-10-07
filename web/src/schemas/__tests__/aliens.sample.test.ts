import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { speciesArraySchema } from '../species.schema';

const SAMPLE_COUNT = 5;

const loadSample = () => {
  const filePath = fileURLToPath(
    new URL('../../../../ALIENS.json', import.meta.url)
  );
  const raw = readFileSync(filePath, 'utf-8');
  const payload = JSON.parse(raw);
  const data = Array.isArray(payload) ? payload : payload?.races;
  if (!Array.isArray(data) || data.length === 0) {
    throw new Error('ALIENS.json must provide a non-empty races array');
  }
  return data.slice(0, SAMPLE_COUNT);
};

describe('ALIENS.json sample validation', () => {
  it('validates the first few species records against the schema', () => {
    const sample = loadSample();
    expect(() => speciesArraySchema.parse(sample)).not.toThrow();
  });
});
