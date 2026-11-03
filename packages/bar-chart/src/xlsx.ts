import type { A11yBarChartSemanticModel, A11yBarChartTarget } from './model.js';
import { message, type MessageDictionary } from './messages.js';
import { isTargetRange } from './target.js';

export interface BarXlsxOptions {
  messages?: MessageDictionary;
  locale?: string;
  chartTitle?: string;
  contextText?: string;
  explanationText?: string;
  dataNoteText?: string;
  categoryHeader?: string;
  countHeader?: string;
  percentageHeader?: string;
  totalHeader?: string;
  targetHeader?: string;
}

type Cell = { value: string | number; type?: 'number' | 'text'; style?: number };
type SheetRow = Cell[];

const encoder = new TextEncoder();

function xml(value: string): string {
  return value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]/g, '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  return name;
}

function cellXml(cell: Cell, reference: string): string {
  if (cell.type === 'number' && typeof cell.value === 'number' && Number.isFinite(cell.value)) {
    return `<c r="${reference}"${cell.style ? ` s="${cell.style}"` : ''}><v>${cell.value}</v></c>`;
  }
  return `<c r="${reference}" t="inlineStr"><is><t xml:space="preserve">${xml(String(cell.value))}</t></is></c>`;
}

function worksheetXml(rows: SheetRow[]): string {
  const rowXml = rows.map((row, rowIndex) => `<row r="${rowIndex + 1}">${row.map((cell, columnIndex) => cellXml(cell, `${columnName(columnIndex)}${rowIndex + 1}`)).join('')}</row>`).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rowXml}</sheetData></worksheet>`;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function u16(view: DataView, offset: number, value: number): void { view.setUint16(offset, value, true); }
function u32(view: DataView, offset: number, value: number): void { view.setUint32(offset, value, true); }

/** Build a minimal, valid OOXML workbook without browser APIs or runtime dependencies. */
function zipStore(files: Array<[string, string]>): Uint8Array<ArrayBuffer> {
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;
  for (const [path, content] of files) {
    const name = encoder.encode(path);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length + data.length);
    const lv = new DataView(local.buffer);
    u32(lv, 0, 0x04034b50); u16(lv, 4, 20); u16(lv, 6, 0x0800); u16(lv, 8, 0);
    u32(lv, 14, crc); u32(lv, 18, data.length); u32(lv, 22, data.length); u16(lv, 26, name.length); u16(lv, 28, 0);
    local.set(name, 30); local.set(data, 30 + name.length);
    localParts.push(local);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    u32(cv, 0, 0x02014b50); u16(cv, 4, 20); u16(cv, 6, 20); u16(cv, 8, 0x0800); u16(cv, 10, 0);
    u32(cv, 16, crc); u32(cv, 20, data.length); u32(cv, 24, data.length); u16(cv, 28, name.length);
    u16(cv, 30, 0); u16(cv, 32, 0); u16(cv, 34, 0); u32(cv, 38, 0); u32(cv, 42, offset);
    central.set(name, 46); centralParts.push(central);
    offset += local.length;
  }
  const centralSize = centralParts.reduce((size, part) => size + part.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length);
  u32(ev, 12, centralSize); u32(ev, 16, offset); u16(ev, 20, 0);
  const result = new Uint8Array(offset + centralSize + end.length);
  let cursor = 0;
  for (const part of [...localParts, ...centralParts, end]) { result.set(part, cursor); cursor += part.length; }
  return result;
}

function targetCell(target: A11yBarChartTarget | null): Cell | null {
  if (target === null) return null;
  if (typeof target === 'number') return { value: target, type: 'number' };
  if (isTargetRange(target)) return { value: `${target.min}–${target.max}`, type: 'text' };
  return null;
}

/**
 * Create a standards-based XLSX from the safe semantic model. Counts and
 * percentages are numeric cells (percentages are fractions formatted as %),
 * so Excel arithmetic works; custom display formatters are intentionally not
 * copied into numeric cells. Suppressed and missing values remain text.
 * This core function is DOM-free; rich authored content should be passed as
 * plain text options when the caller needs to include it.
 */
export function buildBarXlsx(model: A11yBarChartSemanticModel, options: BarXlsxOptions = {}): Uint8Array<ArrayBuffer> {
  const locale = options.locale ?? 'en-US';
  const metadata: SheetRow[] = [];
  const addMetadata = (key: 'csvContextLabel' | 'explanationLabel' | 'csvDataNoteLabel', value: string | undefined) => {
    if (value?.trim()) metadata.push([{ value: message(key, options.messages, {}, locale) }, { value: value.trim() }]);
  };
  if (options.chartTitle?.trim()) metadata.push([{ value: message('title', options.messages, {}, locale) }, { value: options.chartTitle.trim() }]);
  addMetadata('csvContextLabel', options.contextText);
  addMetadata('explanationLabel', options.explanationText);
  addMetadata('csvDataNoteLabel', options.dataNoteText);
  const hasTargets = model.rows.some((row) => row.target !== null || row.targetSuppressed);
  const headers: SheetRow = [{ value: options.categoryHeader ?? message('csvCategoryHeader', options.messages, {}, locale) },
    { value: options.countHeader ?? message('csvCountHeader', options.messages, {}, locale) },
    { value: options.percentageHeader ?? message('csvPercentageHeader', options.messages, {}, locale) },
    ...(hasTargets ? [{ value: options.targetHeader ?? message('csvTargetHeader', options.messages, {}, locale) }] : [])];
  const rows: SheetRow[] = [...metadata, [], headers];
  for (const row of model.rows) {
    const count: Cell = row.status === 'reported' && row.value !== null
      ? { value: row.value, type: 'number' }
      : { value: row.valueText, type: 'text' };
    const percentage: Cell = row.status === 'reported' && row.percentage !== null
      ? { value: row.percentage, type: 'number', style: 1 }
      : { value: row.percentageText, type: 'text' };
    const target = row.targetSuppressed ? { value: row.targetText, type: 'text' as const } : targetCell(row.target) ?? { value: row.targetText, type: 'text' as const };
    rows.push([{ value: row.label }, count, percentage, ...(hasTargets ? [target] : [])]);
  }
  rows.push([{ value: options.totalHeader ?? message('csvTotalHeader', options.messages, {}, locale) },
    model.total === null ? { value: model.totalText, type: 'text' } : { value: model.total, type: 'number' },
    { value: '' }, ...(hasTargets ? [{ value: '' }] : [])]);
  const files: Array<[string, string]> = [
    ['[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>'],
    ['_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'],
    ['xl/workbook.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Chart data" sheetId="1" r:id="rId1"/></sheets></workbook>'],
    ['xl/_rels/workbook.xml.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'],
    ['xl/styles.xml', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="0.00%"/></numFmts><fonts count="1"><font><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs></styleSheet>'],
    ['xl/worksheets/sheet1.xml', worksheetXml(rows)]
  ];
  return zipStore(files);
}
