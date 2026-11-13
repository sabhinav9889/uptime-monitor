import { appendFileSync, readFileSync } from 'node:fs';
import { validateConfig, withDefaults } from '../lib/config.mjs';
import { runCheck } from '../lib/check.mjs';
import { hasFailures, renderReport } from '../lib/report.mjs';

const config = JSON.parse(readFileSync(new URL('../projects.json', import.meta.url), 'utf8'));
const errors = validateConfig(config);
if (errors.length > 0) {
  console.error(`projects.json is invalid:\n- ${errors.join('\n- ')}`);
  process.exit(2);
}
if (process.argv.includes('--validate')) {
  console.log(`projects.json is valid (${config.checks.length} checks).`);
  process.exit(0);
}

const all = withDefaults(config);
const active = all.filter((c) => c.enabled !== false);
const results = await Promise.all(active.map((c) => runCheck(c)));
const report = renderReport(results, all.length - active.length);
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${report}\n`);
process.exit(hasFailures(results) ? 1 : 0);
