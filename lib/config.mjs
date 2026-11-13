const METHODS = ['GET', 'HEAD'];
const SECRET_PARAM = /(token|key|secret|password|passwd|auth|signature|sig)/i;
const REQUIRED = ['project', 'name', 'url'];

/** Merge defaults into every check. Pure: returns new objects. */
export function withDefaults(config) {
  const defaults = config.defaults ?? {};
  return (config.checks ?? []).map((c) => ({ ...defaults, ...c }));
}

function checkProblems(c, index) {
  const where = `checks[${index}] (${c.project ?? '?'}/${c.name ?? '?'})`;
  const errors = [];
  for (const field of REQUIRED) {
    if (typeof c[field] !== 'string' || c[field].trim() === '') {
      errors.push(`${where}: "${field}" is required`);
    }
  }
  if (typeof c.url === 'string' && c.url) errors.push(...urlProblems(c.url, where));
  if (!METHODS.includes(c.method)) errors.push(`${where}: method must be GET or HEAD`);
  if (!Number.isInteger(c.expectStatus) || c.expectStatus < 100 || c.expectStatus > 599) {
    errors.push(`${where}: expectStatus must be an HTTP status code`);
  }
  for (const f of ['timeoutMs', 'retryDelayMs', 'slowMs']) {
    if (!Number.isInteger(c[f]) || c[f] < 0) errors.push(`${where}: ${f} must be 0 or more`);
  }
  if (!Number.isInteger(c.retries) || c.retries < 0 || c.retries > 5) {
    errors.push(`${where}: retries must be between 0 and 5`);
  }
  if (c.method === 'HEAD' && c.expectContains) {
    errors.push(`${where}: expectContains needs GET (HEAD has no body)`);
  }
  return errors;
}

function urlProblems(raw, where) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    return [`${where}: url is not valid`];
  }
  const errors = [];
  if (!['http:', 'https:'].includes(url.protocol)) errors.push(`${where}: url must be http(s)`);
  if (url.username || url.password) errors.push(`${where}: no credentials in a URL`);
  for (const key of url.searchParams.keys()) {
    if (SECRET_PARAM.test(key)) {
      errors.push(`${where}: query parameter "${key}" looks like a secret; keep secrets out of this repo`);
    }
  }
  return errors;
}

/** Returns a list of error strings; empty means the config is valid. */
export function validateConfig(config) {
  if (!config || typeof config !== 'object' || !Array.isArray(config.checks)) {
    return ['config must be an object with a "checks" array'];
  }
  const checks = withDefaults(config);
  const errors = checks.flatMap((c, i) => checkProblems(c, i));
  const seen = new Set();
  for (const c of checks) {
    const id = `${c.project}/${c.name}`;
    if (seen.has(id)) errors.push(`duplicate check "${id}"`);
    seen.add(id);
  }
  return errors;
}
