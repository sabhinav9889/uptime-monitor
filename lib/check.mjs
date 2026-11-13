const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function attempt(check, fetchImpl) {
  const started = Date.now();
  try {
    const res = await fetchImpl(check.url, {
      method: check.method,
      signal: AbortSignal.timeout(check.timeoutMs),
      headers: { 'user-agent': 'uptime-monitor/1.0' },
    });
    const ms = Date.now() - started;
    if (res.status !== check.expectStatus) {
      return { ok: false, status: res.status, ms, reason: `status ${res.status}, expected ${check.expectStatus}` };
    }
    if (check.expectContains) {
      const body = await res.text();
      if (!body.includes(check.expectContains)) {
        return { ok: false, status: res.status, ms, reason: 'response did not contain the expected text' };
      }
    }
    return { ok: true, status: res.status, ms, reason: ms > check.slowMs ? 'slow' : '' };
  } catch (err) {
    const timedOut = err?.name === 'TimeoutError' || err?.name === 'AbortError';
    return { ok: false, status: 0, ms: Date.now() - started, reason: timedOut ? 'timed out' : 'could not connect' };
  }
}

/** Run one check, retrying so a single blip does not raise an alarm. Never throws. */
export async function runCheck(check, { fetchImpl = fetch, wait = sleep } = {}) {
  let result;
  for (let tries = 0; tries <= check.retries; tries += 1) {
    result = await attempt(check, fetchImpl);
    if (result.ok) break;
    if (tries < check.retries) await wait(check.retryDelayMs);
  }
  return { project: check.project, name: check.name, ...result };
}
