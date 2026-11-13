import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCheck } from '../lib/check.mjs';
import { hasFailures, renderReport } from '../lib/report.mjs';

const check = { project: 'p', name: 'n', url: 'https://example.com', method: 'GET', expectStatus: 200, timeoutMs: 1000, retries: 2, retryDelayMs: 0, slowMs: 10_000 };
const reply = (status, body = '') => async () => ({ status, text: async () => body });
const noWait = async () => {};

test('passes on the expected status', async () => {
  const r = await runCheck(check, { fetchImpl: reply(200), wait: noWait });
  assert.equal(r.ok, true);
});

test('fails on the wrong status after retrying', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return { status: 503, text: async () => '' }; };
  const r = await runCheck(check, { fetchImpl, wait: noWait });
  assert.equal(r.ok, false);
  assert.equal(calls, 3);
  assert.match(r.reason, /503/);
});

test('a single blip is retried and then passes', async () => {
  let calls = 0;
  const fetchImpl = async () => { calls += 1; return calls === 1 ? { status: 500, text: async () => '' } : { status: 200, text: async () => '' }; };
  assert.equal((await runCheck(check, { fetchImpl, wait: noWait })).ok, true);
});

test('checks the expected text', async () => {
  const c = { ...check, expectContains: '"status":"ok"' };
  assert.equal((await runCheck(c, { fetchImpl: reply(200, '{"status":"ok"}'), wait: noWait })).ok, true);
  assert.equal((await runCheck(c, { fetchImpl: reply(200, 'hello'), wait: noWait })).ok, false);
});

test('a network error never throws, and is reported without the raw error', async () => {
  const fetchImpl = async () => { throw new TypeError('connect ECONNREFUSED 10.0.0.1:443'); };
  const r = await runCheck(check, { fetchImpl, wait: noWait });
  assert.equal(r.ok, false);
  assert.equal(r.reason, 'could not connect');
});

test('a timeout is named as one', async () => {
  const fetchImpl = async () => { const e = new Error('t'); e.name = 'TimeoutError'; throw e; };
  assert.equal((await runCheck({ ...check, retries: 0 }, { fetchImpl })).reason, 'timed out');
});

test('flags slow but passing checks', async () => {
  const r = await runCheck({ ...check, slowMs: -1 }, { fetchImpl: reply(200), wait: noWait });
  assert.equal(r.ok, true);
  assert.equal(r.reason, 'slow');
});

test('report counts and failure detection', () => {
  const results = [{ project: 'a', name: 'x', ok: true, status: 200, ms: 5, reason: '' }, { project: 'b', name: 'y', ok: false, status: 0, ms: 9, reason: 'timed out' }];
  assert.equal(hasFailures(results), true);
  assert.match(renderReport(results, 1), /1 of 2 checks passed, 1 disabled/);
});
