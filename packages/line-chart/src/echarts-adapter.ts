import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  TitleComponent,
  TooltipComponent
} from 'echarts/components';
import {
  init,
  use,
  type EChartsCoreOption,
  type EChartsType
} from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';

use([LineChart, GridComponent, LegendComponent, TitleComponent, TooltipComponent, CanvasRenderer]);

export class EchartsAdapter {
  #chart: EChartsType;

  constructor(container: HTMLElement) {
    this.#chart = init(container, undefined, { renderer: 'canvas' });
  }

  dispose(): void {
    this.#chart.dispose();
  }

  resize(): void {
    this.#chart.resize();
  }

  convertXToPixel(value: string): number | undefined {
    const pixel = this.#chart.convertToPixel({ xAxisIndex: 0 }, value);
    return typeof pixel === 'number' && Number.isFinite(pixel) ? pixel : undefined;
  }

  hideTip(): void {
    this.#chart.dispatchAction({ type: 'hideTip' });
  }

  onLegendSelection(listener: (selected: Record<string, boolean>) => void): () => void {
    const handler = (...args: unknown[]): void => {
      const event = args[0] as { selected?: Record<string, boolean> } | undefined;
      if (event?.selected) listener(event.selected);
    };
    this.#chart.on('legendselectchanged', handler);
    return () => this.#chart.off('legendselectchanged', handler);
  }

  showTip(dataIndex: number, preferredSeriesId: 'actual-main' | 'target-main'): void {
    const options = this.#chart.getOption() as { series?: Array<{ id?: string }> };
    const seriesIndex = options.series?.findIndex((series) => series.id === preferredSeriesId) ?? -1;
    this.#chart.dispatchAction({ type: 'showTip', dataIndex, seriesIndex: Math.max(0, seriesIndex) });
  }

  update(options: EChartsCoreOption): void {
    this.#chart.setOption(options, { notMerge: true });
  }
}
