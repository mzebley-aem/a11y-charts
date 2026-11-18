import { renderSafeHtml, safeHtmlToText } from '../../chart-core/src/content.js';

export function renderLineRichContent(value: string): DocumentFragment {
  return renderSafeHtml(value);
}

export function lineRichContentToText(value: string): string {
  return safeHtmlToText(value);
}
