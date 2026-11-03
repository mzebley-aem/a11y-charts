import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBarXlsx } from '../src/xlsx.js';
import { buildBarCsv } from '../src/csv.js';
import { buildBarModel } from '../src/semantic-model.js';
import { A11yBarChartElement, defineA11yBarChart } from '../src/index.js';

function localZipFiles(bytes: Uint8Array): Map<string, string> {
  const files = new Map<string, string>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 0;
  while (view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true);
    const nameLength = view.getUint16(offset + 26, true);
    const extraLength = view.getUint16(offset + 28, true);
    const nameStart = offset + 30;
    const dataStart = nameStart + nameLength + extraLength;
    const name = new TextDecoder().decode(bytes.subarray(nameStart, nameStart + nameLength));
    files.set(name, new TextDecoder().decode(bytes.subarray(dataStart, dataStart + size)));
    offset = dataStart + size;
  }
  return files;
}

const flush = async (): Promise<void> => { await Promise.resolve(); await Promise.resolve(); };

describe('buildBarXlsx', () => {
  it('preserves suppressed status when copied legacy data is assigned to another chart', async () => {
    defineA11yBarChart();
    const source = document.createElement('a11y-bar-chart') as A11yBarChartElement;
    source.suppressed = true;
    source.data = [{ id: 'hidden', label: 'Withheld', value: 0 }];
    expect(source.data[0]).toMatchObject({ value: null, valueSuppressed: true });
    const copy = document.createElement('a11y-bar-chart') as A11yBarChartElement;
    copy.data = source.data;
    document.body.append(copy);
    await flush();
    expect(copy.textContent).toContain('Suppressed');
    copy.remove();
  });
  it('creates a valid OOXML package with safe numeric, textual, and localized content', () => {
    const model = buildBarModel([
      { id: 'formula', label: '=1+1 & Café', value: 3, target: 4 },
      { id: 'secret', label: 'Private', value: 987654, valueSuppressed: true, targetSuppressed: true },
      { id: 'missing', label: 'Unknown', value: null }
    ], { total: 10 });
    const bytes = buildBarXlsx(model, {
      chartTitle: 'Résumé <chart>', contextText: 'Selected & filtered', explanationText: 'Authored insight', dataNoteText: 'Source: A > B'
    });
    expect(String.fromCharCode(...bytes.subarray(0, 2))).toBe('PK');
    const files = localZipFiles(bytes);
    expect(files.has('[Content_Types].xml')).toBe(true);
    const sheet = files.get('xl/worksheets/sheet1.xml')!;
    expect(sheet).toContain('Café');
    expect(sheet).toContain('&lt;chart&gt;');
    expect(sheet).toContain('Selected &amp; filtered');
    expect(sheet).toContain('Authored insight');
    expect(sheet).toContain('Source: A &gt; B');
    expect(sheet).toContain('<c r="B7"><v>3</v></c>');
    expect(sheet).toContain('<c r="C7" s="1"><v>0.3</v></c>');
    expect(sheet).not.toContain('987654');
    expect(sheet).not.toContain('<v>987654</v>');
    expect(sheet).toContain('Suppressed');
    expect(sheet).toContain('Not reported');
    expect(sheet).toContain('<v>4</v>');
    expect(sheet).not.toContain('<f>');
  });

  it('adds authored title and explanation as safe localized CSV metadata', () => {
    const model = buildBarModel([{ id: 'a', label: 'Alpha', value: 1 }]);
    const csv = buildBarCsv(model, {
      chartTitle: 'Safety, report', contextText: 'Selected group', explanationText: 'Authored, supported reason',
      messages: { title: 'Titre', csvContextLabel: 'Contexte', explanationLabel: 'Explication' }
    });
    expect(csv.split('\r\n').slice(0, 3)).toEqual([
      'Titre,"Safety, report"',
      'Contexte,Selected group',
      'Explication,"Authored, supported reason"'
    ]);
    expect(csv).not.toContain('<p>');
  });

  it('downloads XLSX with the workbook MIME type and title-based filename', async () => {
    defineA11yBarChart();
    const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
    chart.chartTitle = 'Safe Report';
    chart.data = [{ id: 'x', label: 'X', value: 2 }];
    chart.config = { showExport: true, dataView: 'inline' };
    document.body.append(chart);
    await flush();
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    let downloaded = '';
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloaded = this.download; });
    chart.querySelector<HTMLButtonElement>('[data-focus-key="export-xlsx"]')?.click();
    const blob = create.mock.calls[0]?.[0] as Blob;
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(click).toHaveBeenCalledOnce();
    expect(downloaded).toBe('Safe-Report.xlsx');
    expect(await blob.arrayBuffer()).toBeInstanceOf(ArrayBuffer);
    create.mockRestore();
    click.mockRestore();
  });

  it('uses safe authored Explain content and includes it in display-change details', async () => {
    defineA11yBarChart();
    const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
    chart.data = [{ id: 'x', label: 'X', value: 2 }];
    document.body.append(chart);
    await flush();
    const changes: CustomEvent[] = [];
    chart.addEventListener('a11y-bar-chart-display-change', (event) => changes.push(event as CustomEvent));
    chart.explanation = '<p>Authored <strong>reason</strong><script>bad()</script></p>';
    await flush();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="explain"]')?.click();
    await flush();
    const region = chart.querySelector(`#${chart.instanceId}-explanation`)!;
    expect(region.textContent).toContain('Authored reason');
    expect(region.textContent).not.toContain('reported total');
    expect(region.querySelector('script')).toBeNull();
    expect(changes[changes.length - 1]?.detail.explanation).toContain('<strong>reason</strong>');
  });

  it('shows authored explanation in the Data view and redacts explicitly suppressed values from copies and events', async () => {
    defineA11yBarChart();
    const chart = document.createElement('a11y-bar-chart') as A11yBarChartElement;
    chart.data = [{ id: 'first', label: 'First', value: 1 }];
    chart.explanation = '<p>Authored <em>selection insight</em><script>secret()</script></p>';
    document.body.append(chart);
    await flush();
    chart.querySelector<HTMLButtonElement>('[data-focus-key="data"]')?.click();
    await flush();
    const dataContent = chart.querySelector('.a11y-bar-chart__dialog [data-dialog-content]')!;
    expect(dataContent.textContent).toContain('Explanation');
    expect(dataContent.textContent).toContain('Authored selection insight');
    expect(dataContent.querySelector('script')).toBeNull();

    const changes: CustomEvent[] = [];
    chart.addEventListener('a11y-bar-chart-data-change', (event) => changes.push(event as CustomEvent));
    chart.data = [{ id: 'private', label: 'Private', value: 7654321, valueSuppressed: true }];
    expect(chart.data[0]?.value).toBeNull();
    await flush();
    const change = changes[0]?.detail;
    expect(change.data[0].value).toBeNull();
    expect(change.model.rows[0].value).toBeNull();
    expect(JSON.stringify(change)).not.toContain('7654321');
  });
});
