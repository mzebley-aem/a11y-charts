import { positionFloatingCard } from '../../chart-core/src/ui/position-floating-card.js';
import { FloatingCardController } from '../../chart-core/src/ui/floating-card-controller.js';

/** Bar-specific class-name adapter over the shared nonmodal floating-card controller. */
export class BarDetailsController {
  #controller: FloatingCardController;
  #disposeEntries: Array<() => void> = [];

  constructor(previewText: string, pinnedText: string) {
    this.#controller = new FloatingCardController({
      previewText,
      pinnedText,
      classNames: {
        activeRoot: 'a11y-bar-chart__row--active',
        above: 'a11y-bar-chart__details--above',
        inFlow: 'a11y-bar-chart__details--in-flow'
      }
    });
  }

  register(row: HTMLElement, trigger: HTMLButtonElement, card: HTMLElement, status: HTMLElement): void {
    let pointerX: number | undefined;
    const onEnter = (event: PointerEvent) => {
      if (!card.matches(':hover') && trigger.getAttribute('aria-pressed') !== 'true') pointerX = event.clientX - trigger.getBoundingClientRect().left;
    };
    const onMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' || (event.target instanceof Node && card.contains(event.target)) ||
          trigger.getAttribute('aria-pressed') === 'true') return;
      pointerX = event.clientX - trigger.getBoundingClientRect().left;
      this.#controller.reposition();
    };
    const onFocus = (event: FocusEvent) => { if (event.target === trigger) pointerX = undefined; };
    row.addEventListener('pointerenter', onEnter);
    row.addEventListener('focusin', onFocus);
    row.addEventListener('pointermove', onMove);
    this.#disposeEntries.push(() => {
      row.removeEventListener('pointerenter', onEnter);
      row.removeEventListener('focusin', onFocus);
      row.removeEventListener('pointermove', onMove);
    });
    this.#disposeEntries.push(this.#controller.register({
      root: row, trigger, card, status,
      anchor: () => {
        const rect = trigger.getBoundingClientRect();
        return pointerX === undefined ? rect : new DOMRect(rect.left + pointerX, rect.top, 0, rect.height);
      },
      position: anchor => positionFloatingCard(card, anchor, 'below', 'a11y-bar-chart__details--in-flow')
    }));
  }

  destroy(): void {
    for (const dispose of this.#disposeEntries.splice(0)) dispose();
    this.#controller.destroy();
  }
}
