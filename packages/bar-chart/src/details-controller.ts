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
    this.#disposeEntries.push(this.#controller.register({ root: row, trigger, card, status }));
  }

  destroy(): void {
    for (const dispose of this.#disposeEntries.splice(0)) dispose();
    this.#controller.destroy();
  }
}
