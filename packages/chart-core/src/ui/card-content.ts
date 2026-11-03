export interface CardContentRow {
  label?: string;
  value?: string;
  text?: string;
}

export interface CardContentStatus {
  text: string;
  color?: string;
  backgroundColor?: string;
  className?: string;
  ariaHidden?: boolean;
}

export interface CardContentModel {
  heading: string;
  ariaLabel?: string;
  role?: 'group' | 'region';
  headingId?: string;
  rows: CardContentRow[];
  description?: string;
  status?: CardContentStatus;
  visuallyHidden?: boolean;
  valuesAsDefinitionList?: boolean;
  titleTag?: 'div' | 'strong';
}

export interface CardContentClassNames {
  root?: string;
  visuallyHidden?: string;
  header?: string;
  heading?: string;
  title?: string;
  status?: string;
  values?: string;
  row?: string;
  label?: string;
  value?: string;
  description?: string;
}

export interface CardContentElements {
  root: HTMLElement;
  header: HTMLElement;
  heading: HTMLElement;
  title: HTMLElement;
  status?: HTMLElement;
  values: HTMLElement;
  description?: HTMLElement;
}

const DEFAULT_CLASSES: Required<CardContentClassNames> = {
  root: 'chart-card', visuallyHidden: 'chart-card--visually-hidden',
  header: 'chart-card__header', heading: 'chart-card__heading', title: 'chart-card__title',
  status: 'chart-card__status', values: 'chart-card__values', row: 'chart-card__row',
  label: 'chart-card__label', value: 'chart-card__value', description: 'chart-card__description'
};
function classes(input: CardContentClassNames = {}): Required<CardContentClassNames> {
  return { ...DEFAULT_CLASSES, ...input };
}

/** Builds a text-safe card hierarchy and returns its parts for chart-specific additions. */
export function createCardContent(ownerDocument: Document, model: CardContentModel,
  classNames: CardContentClassNames = {}): CardContentElements {
  const names = classes(classNames);
  const root = ownerDocument.createElement('div');
  root.className = `${names.root}${model.visuallyHidden ? ` ${names.visuallyHidden}` : ''}`;
  if (model.ariaLabel) { root.setAttribute('role', model.role ?? 'region'); root.setAttribute('aria-label', model.ariaLabel); }
  if (model.headingId) root.setAttribute('aria-labelledby', model.headingId);

  const header = ownerDocument.createElement('div'); header.className = names.header;
  const heading = ownerDocument.createElement('div'); heading.className = names.heading;
  const title = ownerDocument.createElement(model.titleTag ?? 'div');
  title.className = names.title; title.textContent = model.heading;
  if (model.headingId) title.id = model.headingId;
  heading.append(title);
  let status: HTMLElement | undefined;
  if (model.status) {
    status = ownerDocument.createElement('span');
    status.className = [names.status, model.status.className].filter(Boolean).join(' ');
    status.textContent = model.status.text;
    const color = model.status.color ? safeColor(model.status.color) : undefined;
    const backgroundColor = model.status.backgroundColor ? safeColor(model.status.backgroundColor) : undefined;
    if (color) status.style.color = color;
    if (backgroundColor) status.style.backgroundColor = backgroundColor;
    if (model.status.ariaHidden) status.setAttribute('aria-hidden', 'true');
    heading.append(status);
  }
  header.append(heading); root.append(header);

  const values = ownerDocument.createElement(model.valuesAsDefinitionList ? 'dl' : 'div');
  values.className = names.values;
  for (const item of model.rows) {
    if (model.valuesAsDefinitionList && item.text === undefined) {
      const label = ownerDocument.createElement('dt'); label.className = names.label; label.textContent = item.label ?? '';
      const value = ownerDocument.createElement('dd'); value.className = names.value; value.textContent = item.value ?? '';
      values.append(label, value);
    } else {
      const row = ownerDocument.createElement('div'); row.className = names.row;
      if (item.text !== undefined) row.textContent = item.text;
      else {
        const label = ownerDocument.createElement('span'); label.className = names.label; label.textContent = item.label ?? '';
        const value = ownerDocument.createElement('span'); value.className = names.value; value.textContent = item.value ?? '';
        row.append(label, value);
      }
      values.append(row);
    }
  }
  root.append(values);
  let description: HTMLElement | undefined;
  if (model.description) { description = ownerDocument.createElement('p'); description.className = names.description; description.textContent = model.description; root.append(description); }
  return { root, header, heading, title, ...(status ? { status } : {}), values, ...(description ? { description } : {}) };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[c] ?? c);
}
function safeColor(value: string): string | undefined {
  const candidate = value.trim();
  if (candidate.length > 80 || /[;{}<>\\]/.test(candidate)) return undefined;
  if (typeof CSS !== 'undefined' && typeof CSS.supports === 'function') return CSS.supports('color', candidate) ? candidate : undefined;
  return /^(#[\da-f]{3,8}|[a-z]{1,24}|(?:rgb|hsl)a?\([\d.%\s,/+-]+\))$/i.test(candidate) ? candidate : undefined;
}
/** Serializes the same text-only structure for chart engines that accept formatter HTML. */
export function renderCardHtml(model: CardContentModel, classNames: CardContentClassNames = {}): string {
  const names = classes(classNames);
  const rootClass = `${names.root}${model.visuallyHidden ? ` ${names.visuallyHidden}` : ''}`;
  const role = model.ariaLabel ? ` role="${model.role ?? 'region'}" aria-label="${escapeHtml(model.ariaLabel)}"` : '';
  const labelledBy = model.headingId ? ` aria-labelledby="${escapeHtml(model.headingId)}"` : '';
  const color = model.status?.color ? safeColor(model.status.color) : undefined;
  const backgroundColor = model.status?.backgroundColor ? safeColor(model.status.backgroundColor) : undefined;
  const style = [color ? `color:${escapeHtml(color)}` : '', backgroundColor ? `background:${escapeHtml(backgroundColor)}` : ''].filter(Boolean).join(';');
  const status = model.status ? `<span class="${escapeHtml([names.status, model.status.className].filter(Boolean).join(' '))}"${style ? ` style="${style}"` : ''}${model.status.ariaHidden ? ' aria-hidden="true"' : ''}>${escapeHtml(model.status.text)}</span>` : '';
  const tag = model.titleTag ?? 'div';
  const title = `<${tag} class="${escapeHtml(names.title)}"${model.headingId ? ` id="${escapeHtml(model.headingId)}"` : ''}>${escapeHtml(model.heading)}</${tag}>`;
  const header = `<div class="${escapeHtml(names.header)}"><div class="${escapeHtml(names.heading)}">${title}${status}</div></div>`;
  const rows = model.rows.map((item) => {
    if (item.text !== undefined) return `<div class="${escapeHtml(names.row)}">${escapeHtml(item.text)}</div>`;
    if (model.valuesAsDefinitionList) return `<dt class="${escapeHtml(names.label)}">${escapeHtml(item.label ?? '')}</dt><dd class="${escapeHtml(names.value)}">${escapeHtml(item.value ?? '')}</dd>`;
    return `<div class="${escapeHtml(names.row)}"><span class="${escapeHtml(names.label)}">${escapeHtml(item.label ?? '')}</span><span class="${escapeHtml(names.value)}">${escapeHtml(item.value ?? '')}</span></div>`;
  }).join('');
  const tagName = model.valuesAsDefinitionList ? 'dl' : 'div';
  const description = model.description ? `<p class="${escapeHtml(names.description)}">${escapeHtml(model.description)}</p>` : '';
  return `<div class="${escapeHtml(rootClass)}"${role}${labelledBy}>${header}<${tagName} class="${escapeHtml(names.values)}">${rows}</${tagName}>${description}</div>`;
}
