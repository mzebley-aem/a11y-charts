const core = await import('@a11y-charts/line-chart/core');
if (typeof globalThis.HTMLElement !== 'undefined') throw new Error('Smoke must run without a DOM global.');
if (typeof core.resolveConfig !== 'function' || typeof core.buildSemanticModel !== 'function' || typeof core.validateData !== 'function') {
  throw new Error('The built line core entry is missing expected helpers.');
}
core.resolveConfig();
core.formatLineMessage('Actual vs Target Performance');
if (!core.validateData([{ x: 'smoke', actual: 1 }]).valid) throw new Error('Line validation smoke failed.');
const csv = core.buildLineCsv({
  data: [], model: { points: [], baseline: undefined }, headers: [], formatPeriod: String,
  formatValue: String, missing: '', suppressed: '', contextText: 'Plain context'
});
if (!csv.includes('Plain context')) throw new Error('Line DOM-free CSV smoke failed.');
const emptyOverride = core.buildLineCsv({
  data: [], model: { points: [], baseline: undefined }, headers: [], formatPeriod: String,
  formatValue: String, missing: '', suppressed: '', contextText: '', context: '<p>must not parse</p>',
  dataNoteText: '', dataNote: '<p>must not parse</p>'
});
if (emptyOverride.includes('must not parse') || emptyOverride.includes('Context')) throw new Error('Line empty plain-text override smoke failed.');
try {
  core.buildLineCsv({
    data: [], model: { points: [], baseline: undefined }, headers: [], formatPeriod: String,
    formatValue: String, missing: '', suppressed: '', context: '<p>Requires a DOM</p>'
  });
  throw new Error('Line rich HTML unexpectedly worked without a DOM.');
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('pass contextText or dataNoteText')) throw error;
}
console.log('Built line core import passed without DOM globals.');
