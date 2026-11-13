import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(import.meta.dirname, '..', 'fixtures', name), 'utf8'));
}
