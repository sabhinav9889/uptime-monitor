import { readFileSync, writeFileSync } from 'node:fs';
import { validateConfig } from '../lib/config.mjs';

const [project, name, url, ...rest] = process.argv.slice(2);
if (!project || !name || !url) {
  console.error('Usage: npm run add -- <project> <check-name> <url> [--contains "text"]');
  process.exit(2);
}
const file = new URL('../projects.json', import.meta.url);
const config = JSON.parse(readFileSync(file, 'utf8'));
const entry = { project, name, url };
const at = rest.indexOf('--contains');
if (at !== -1 && rest[at + 1]) entry.expectContains = rest[at + 1];
config.checks.push(entry);

const errors = validateConfig(config);
if (errors.length > 0) {
  console.error(`Not added:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
console.log(`Added ${project}/${name}. Run "npm run check" to try it.`);
