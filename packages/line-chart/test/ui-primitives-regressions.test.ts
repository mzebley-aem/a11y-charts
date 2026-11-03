import { describe, expect, it, vi } from 'vitest';
import { createCardContent, renderCardHtml } from '../../chart-core/src/ui/card-content.js';
import { FloatingCardController } from '../../chart-core/src/ui/floating-card-controller.js';
import { ModalController } from '../../chart-core/src/ui/modal-controller.js';

describe('shared chart UI primitives', () => {
  it('releases document handlers on close and disconnect and reinstalls them on reconnect', () => {
    const host = document.createElement('div'); const dialog = document.createElement('dialog');
    host.append(dialog); document.body.append(host);
    Object.defineProperty(dialog, 'open', { configurable: true, writable: true, value: false });
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    dialog.close = vi.fn(() => { dialog.open = false; });
    const listener = vi.spyOn(document, 'addEventListener');
    const controller = new ModalController({ dialog, host, getOpener: () => undefined });
    const signals = () => listener.mock.calls.filter(([type]) => type === 'keydown')
      .map(([, , options]) => (options as AddEventListenerOptions).signal!);
    try {
      expect(signals()).toHaveLength(0);
      for (let index = 0; index < 3; index++) {
        controller.open();
        expect(signals().filter(signal => !signal.aborted)).toHaveLength(1);
        controller.disconnect(true); host.remove();
        expect(signals().every(signal => signal.aborted)).toBe(true);
        document.body.append(host); controller.reconnect();
        expect(signals().filter(signal => !signal.aborted)).toHaveLength(1);
        controller.close();
        expect(signals().every(signal => signal.aborted)).toBe(true);
      }
      controller.open(); dialog.close(); dialog.dispatchEvent(new Event('close'));
      expect(signals().every(signal => signal.aborted)).toBe(true);
    } finally { controller.destroy(); host.remove(); listener.mockRestore(); }
  });
  it('keeps DOM and formatter card structures equivalent and text-safe', () => {
    const model = {
      heading: '<period>', role: 'group' as const, ariaLabel: 'chart tooltip',
      rows: [{ label: '<actual>', value: '& 10' }, { text: 'Target 12' }],
      description: 'difference < 0', status: { text: 'above', ariaHidden: true }
    };
    const classNames = { root: 'tooltip', header: 'tooltip__header', heading: 'tooltip__heading', title: 'tooltip__title', status: 'tooltip__status', values: 'tooltip__values', row: 'tooltip__row', label: 'tooltip__label', value: 'tooltip__value', description: 'tooltip__description' };
    const built = createCardContent(document, model, classNames).root;
    const parsed = document.createElement('div'); parsed.innerHTML = renderCardHtml(model, classNames);
    expect(built.outerHTML).toBe(parsed.firstElementChild?.outerHTML);
    expect(built.textContent).toContain('<period>');
    expect(built.querySelector('.tooltip__title')?.children.length).toBe(0);
  });

  it('rejects unsafe inline colors in formatter serialization', () => {
    const markup = renderCardHtml({ heading: 'Period', rows: [], status: { text: 'status', color: 'red;position:fixed' } });
    expect(markup).not.toContain('style=');
  });

  it('uses a registered floating card for preview, pin, and Escape dismissal', () => {
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const card = document.createElement('div'); card.hidden = true;
    const status = document.createElement('span');
    root.append(trigger, card, status); document.body.append(root);
    const controller = new FloatingCardController({ previewText: 'Preview', pinnedText: 'Pinned' });
    const entry = { root, trigger, card, status };
    controller.register(entry);
    root.dispatchEvent(new Event('pointerenter'));
    expect(card.hidden).toBe(false);
    trigger.click();
    expect(status.textContent).toBe('Pinned');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(card.hidden).toBe(true);
    expect(trigger.getAttribute('aria-pressed')).toBe('false');
    controller.destroy(); root.remove();
  });

  it('preserves pin state on re-entry and unregisters entry listeners', () => {
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const card = document.createElement('div'); card.hidden = true;
    const status = document.createElement('span');
    root.append(trigger, card, status); document.body.append(root);
    const controller = new FloatingCardController({ previewText: 'Preview', pinnedText: 'Pinned' });
    const entry = { root, trigger, card, status };
    const unregister = controller.register(entry);
    trigger.click();
    root.dispatchEvent(new Event('pointerenter'));
    expect(status.textContent).toBe('Pinned');
    expect(trigger.getAttribute('aria-pressed')).toBe('true');
    unregister();
    root.dispatchEvent(new Event('pointerenter'));
    expect(card.hidden).toBe(true);
    controller.destroy(); root.remove();
  });

  it('allows a later keyboard re-entry after Escape dismissal and blur', () => {
    const root = document.createElement('div');
    const trigger = document.createElement('button');
    const card = document.createElement('div'); card.hidden = true;
    root.append(trigger, card); document.body.append(root);
    const outside = document.createElement('button'); document.body.append(outside);
    const controller = new FloatingCardController({ previewText: 'Preview', pinnedText: 'Pinned' });
    controller.register({ root, trigger, card });
    root.dispatchEvent(new Event('pointerenter'));
    trigger.focus();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(card.hidden).toBe(true);
    outside.focus();
    trigger.focus();
    expect(card.hidden).toBe(false);
    controller.destroy(); root.remove(); outside.remove();
  });

  it('ignores a queued stale close after modal disconnect and reconnect', () => {
    const host = document.createElement('div'); const dialog = document.createElement('dialog');
    host.append(dialog); document.body.append(host);
    Object.defineProperty(dialog, 'open', { configurable: true, writable: true, value: false });
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    dialog.close = vi.fn(() => { dialog.open = false; });
    const states: boolean[] = [];
    const controller = new ModalController({ dialog, host, getOpener: () => undefined, onStateChange: (open) => states.push(open) });
    expect(controller.open()).toBe('opened');
    controller.disconnect(true);
    expect(controller.reconnect()).toBe('opened');
    dialog.dispatchEvent(new Event('close'));
    expect(controller.isOpen).toBe(true);
    expect(states).toEqual([true, false, true]);
    controller.destroy(); host.remove();
  });

  it('keeps modal state truthful when native close throws and never restores focus to hidden UI', () => {
    const host = document.createElement('div'); const dialog = document.createElement('dialog');
    const opener = document.createElement('button'); opener.style.display = 'none';
    host.append(dialog, opener); document.body.append(host);
    Object.defineProperty(dialog, 'open', { configurable: true, writable: true, value: false });
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    dialog.close = vi.fn(() => { throw new Error('native close failed'); });
    const states: boolean[] = [];
    const controller = new ModalController({ dialog, host, getOpener: () => opener, onStateChange: (open) => states.push(open) });
    expect(controller.open()).toBe('opened');
    expect(controller.close()).toBe('failed');
    expect(controller.isOpen).toBe(true);
    expect(states).toEqual([true]);

    dialog.close = vi.fn(() => { dialog.open = false; });
    expect(controller.close()).toBe('closed');
    expect(controller.isOpen).toBe(false);
    expect(states).toEqual([true, false]);
    expect(document.activeElement).not.toBe(opener);
    expect(controller.close()).toBe('already-closed');
    controller.destroy(); host.remove();
  });

  it('recovers focus when Tab starts outside an open modal after content replacement', () => {
    const host = document.createElement('div'); const dialog = document.createElement('dialog');
    const first = document.createElement('button'); const last = document.createElement('button');
    const outside = document.createElement('button');
    dialog.append(first, last); host.append(dialog, outside); document.body.append(host);
    Object.defineProperty(dialog, 'open', { configurable: true, writable: true, value: false });
    dialog.showModal = vi.fn(() => { dialog.open = true; });
    dialog.close = vi.fn(() => { dialog.open = false; });
    const controller = new ModalController({ dialog, host, getOpener: () => outside });
    expect(controller.open()).toBe('opened');
    outside.focus();
    const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(tab);
    expect(tab.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);
    controller.destroy(); host.remove();
  });
});
