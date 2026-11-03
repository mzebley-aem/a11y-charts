const ALLOWED_TAGS = new Set(['P', 'STRONG', 'EM', 'B', 'I', 'UL', 'OL', 'LI', 'BR', 'A']);
const DROP_CONTENT_TAGS = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'SVG', 'MATH', 'TEMPLATE', 'NOSCRIPT']);
const DOM_REQUIRED_MESSAGE = 'Rich HTML requires a browser DOM. For server-side CSV generation, pass contextText or dataNoteText instead.';

function requireDOM(): void {
  if (typeof document === 'undefined' || typeof DOMParser === 'undefined') throw new Error(DOM_REQUIRED_MESSAGE);
}

function safeHref(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed || /[\u0000-\u001f\\]/.test(trimmed) || trimmed.startsWith('//')) return null;
  const scheme = /^([a-z][a-z\d+.-]*):/i.exec(trimmed)?.[1]?.toLowerCase();
  if (scheme) return ['http', 'https', 'mailto', 'tel'].includes(scheme) ? trimmed : null;
  return trimmed;
}

function copyNode(node: Node, output: DocumentFragment | Element): void {
  if (node.nodeType === Node.TEXT_NODE) {
    output.append(document.createTextNode(node.textContent ?? ''));
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;
  const source = node as Element;
  if (DROP_CONTENT_TAGS.has(source.tagName)) return;
  if (!ALLOWED_TAGS.has(source.tagName)) {
    for (const child of Array.from(source.childNodes)) copyNode(child, output);
    return;
  }
  const clean = document.createElement(source.tagName.toLowerCase());
  if (source.tagName === 'A') {
    const href = source.getAttribute('href');
    const safe = href ? safeHref(href) : null;
    if (safe) clean.setAttribute('href', safe);
  }
  for (const child of Array.from(source.childNodes)) copyNode(child, clean);
  output.append(clean);
}

/** Parses authored markup through the chart content allowlist. Requires a browser DOM. */
export function renderSafeHtml(value: string): DocumentFragment {
  requireDOM();
  const fragment = document.createDocumentFragment();
  if (typeof value !== 'string' || !value) return fragment;
  const parsed = new DOMParser().parseFromString(value, 'text/html');
  for (const child of Array.from(parsed.body.childNodes)) copyNode(child, fragment);
  return fragment;
}

/** Extracts readable text from allowed rich content, without exposing markup. */
export function safeHtmlToText(value: string): string {
  const fragment = renderSafeHtml(value);
  const chunks: string[] = [];
  const walk = (node: Node): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      chunks.push(node.textContent ?? '');
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE && node.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
    const element = node.nodeType === Node.ELEMENT_NODE ? node as Element : null;
    const block = element !== null && ['P', 'UL', 'OL', 'LI'].includes(element.tagName);
    if (element?.tagName === 'BR') chunks.push('\n');
    else for (const child of Array.from(node.childNodes)) walk(child);
    if (block) chunks.push('\n');
  };
  walk(fragment);
  return chunks.join('').replace(/[ \t]*\n[ \t]*/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}
