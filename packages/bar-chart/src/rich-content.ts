import { renderSafeHtml, safeHtmlToText } from '../../chart-core/src/content.js';

/** Parses authored HTML through the shared chart allowlist. Call in a browser/document environment. */
export function renderRichContent(value: string): DocumentFragment {
  return renderSafeHtml(value);
}

/** Extracts readable text from supported rich content without exposing markup. */
export function richContentToText(value: string): string {
  return safeHtmlToText(value);
}
