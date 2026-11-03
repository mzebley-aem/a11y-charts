const core = await import('@a11y-charts/bar-chart/core');
if (typeof globalThis.HTMLElement !== 'undefined') throw new Error('Smoke must run without a DOM global.');
if (typeof core.resolveConfig !== 'function' || typeof core.buildBarModel !== 'function' || typeof core.validateBarData !== 'function') {
  throw new Error('The built bar core entry is missing expected helpers.');
}
core.resolveConfig();
core.message('title');
const data = [{ id: 'smoke', label: 'Smoke', value: 1 }];
if (!core.validateBarData(data).valid) throw new Error('Bar validation smoke failed.');
const model = core.buildBarModel(data);
if (!core.buildBarCsv(model, { contextText: 'Plain context' }).includes('Plain context')) throw new Error('Bar DOM-free CSV smoke failed.');
const emptyOverride = core.buildBarCsv(model, { contextText: '', context: '<p>must not parse</p>', dataNoteText: '', dataNote: '<p>must not parse</p>' });
if (emptyOverride.includes('must not parse') || emptyOverride.includes('Context')) throw new Error('Bar empty plain-text override smoke failed.');
try {
  core.buildBarCsv(model, { context: '<p>Requires a DOM</p>' });
  throw new Error('Bar rich HTML unexpectedly worked without a DOM.');
} catch (error) {
  if (!(error instanceof Error) || !error.message.includes('pass contextText or dataNoteText')) throw error;
}
console.log('Built bar core import passed without DOM globals.');
