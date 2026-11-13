import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { validateConfig, withDefaults } from '../lib/config.mjs';

const base = { defaults: { method: 'GET', expectStatus: 200, timeoutMs: 1000, retries: 1, retryDelayMs: 0, slowMs: 500 } };
const one = (check) => ({ ...base, checks: [{ project: 'p', name: 'n', url: 'https://example.com', ...check }] });

test('the real projects.json is valid', () => {
  const config = JSON.parse(readFileSync(new URL('../projects.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateConfig(config), []);
});

test('a good check passes and defaults are merged', () => {
  assert.deepEqual(validateConfig(one({})), []);
  assert.equal(withDefaults(one({ retries: 3 }))[0].retries, 3);
  assert.equal(withDefaults(one({}))[0].method, 'GET');
});

test('rejects a missing field, bad url and non-http scheme', () => {
  assert.match(validateConfig(one({ name: '' })).join(), /"name" is required/);
  assert.match(validateConfig(one({ url: 'nope' })).join(), /not valid/);
  assert.match(validateConfig(one({ url: 'ftp://example.com' })).join(), /http\(s\)/);
});

test('refuses secrets in the url', () => {
  assert.match(validateConfig(one({ url: 'https://u:p@example.com' })).join(), /credentials/);
  assert.match(validateConfig(one({ url: 'https://example.com/?apikey=abc' })).join(), /secret/);
});

test('rejects duplicates, bad retries and HEAD with expectContains', () => {
  const dup = { ...base, checks: [one({}).checks[0], one({}).checks[0]] };
  assert.match(validateConfig(dup).join(), /duplicate/);
  assert.match(validateConfig(one({ retries: 9 })).join(), /retries/);
  assert.match(validateConfig(one({ method: 'HEAD', expectContains: 'x' })).join(), /HEAD/);
});

test('rejects a config without a checks array', () => {
  assert.equal(validateConfig({}).length, 1);
  assert.equal(validateConfig(null).length, 1);
});
