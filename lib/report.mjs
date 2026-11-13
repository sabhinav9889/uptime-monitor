const icon = (r) => (!r.ok ? '❌' : r.reason === 'slow' ? '⚠️' : '✅');

/** A Markdown table for the Actions job summary and the terminal. */
export function renderReport(results, skipped = 0) {
  const lines = ['| | Project | Check | Status | Time | Note |', '|---|---|---|---|---|---|'];
  for (const r of results) {
    const status = r.status === 0 ? '-' : String(r.status);
    lines.push(`| ${icon(r)} | ${r.project} | ${r.name} | ${status} | ${r.ms} ms | ${r.reason} |`);
  }
  const failed = results.filter((r) => !r.ok).length;
  lines.push('', `${results.length - failed} of ${results.length} checks passed, ${skipped} disabled.`);
  return lines.join('\n');
}

export const hasFailures = (results) => results.some((r) => !r.ok);
