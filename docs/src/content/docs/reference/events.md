---
title: Events
description: Every event the chart elements dispatch, with its detail payload.
---

Every event is a `CustomEvent` that bubbles, so you can listen on the chart or on any ancestor. Event names start with the element name: `a11y-target-line-chart-`, `a11y-bar-chart-`, or `a11y-segmented-bar-chart-`. The line and bar packages export a type for each event's detail, such as `A11yTargetLineChartPointChangeDetail` or `A11yBarChartDataChangeDetail`. The segmented package doesn't export detail types, so type its payloads locally from the tables below.

```ts
import type { A11yBarChartDataChangeDetail } from '@mzebley-aem/bar-chart';

chart.addEventListener('a11y-bar-chart-data-change', (event) => {
	const { data, model } = (event as CustomEvent<A11yBarChartDataChangeDetail>).detail;
});
```

Payloads are copies. Changing them doesn't change the chart: assign a property instead.

## Which chart fires what

| Event suffix | Line | Bar | Segmented |
| --- | --- | --- | --- |
| `-ready` | ✓ | ✓ | ✓ |
| `-error` | ✓ | ✓ | ✓ |
| `-data-change` | ✓ | ✓ | ✓ |
| `-data-view-change` | ✓ | ✓ | ✓ |
| `-disclosure-change` | ✓ | ✓ | ✓ |
| `-point-change` | ✓ | | |
| `-settings-change` | ✓ | | |

`<a11y-bar-chart-group>` adds `a11y-bar-chart-group-selection-change`, and its inner chart's events bubble through it.

## Shared events

### `-ready`

Fires once, after the first usable render.

| Field | Type |
| --- | --- |
| `instanceId` | `string`, unique to this element |

### `-error`

Fires when data, configuration, or the `messages` attribute is invalid. The chart shows an error state instead of throwing.

| Field | Type |
| --- | --- |
| `code` | `string`. Machine-readable. The target line chart uses `invalid-data`, `invalid-baseline`, and `invalid-messages`. The bar and segmented charts use their validation codes, such as `validationDuplicateId`, and `invalid-messages`. |
| `message` | `string`, localized |
| `data` | Bar chart only: a copy of the rejected data |

An invalid baseline doesn't stop the target line chart: it renders without the baseline.

### `-data-change`

Fires after the first render when the data, total, baseline, or error state changes. It doesn't fire for the initial data. The line and bar charts skip assignments that don't change anything, and the target line chart combines several assignments in the same task into one event.

| Field | Type |
| --- | --- |
| `data` | A copy of the current data. The bar and segmented charts report suppressed zeros as `null`. See [Suppression](/guides/suppression-and-missing-data/). |
| `model` | The semantic model the chart renders from, or `null` when the data is unavailable |

### `-data-view-change`

Fires when a reader opens or closes the data dialog or inline table, or when switching to `dataView: 'none'` closes an open one.

| Field | Type |
| --- | --- |
| `open` | `boolean` |
| `dataView` | `'dialog'` or `'inline'` |

### `-disclosure-change`

Fires when a reader expands or collapses the Explain or Glossary section.

| Field | Type |
| --- | --- |
| `disclosure` | `'explanation'` or `'glossary'` |
| `expanded` | `boolean` |

## Target line chart only

### `a11y-target-line-chart-point-change`

Fires when the reader selects a period, by keyboard, pointer, or the Previous and Next buttons.

| Field | Type |
| --- | --- |
| `index` | Position of the period in the data |
| `x` | The period's `x` value |
| `actual` | Value in your scale, or `null` when missing or suppressed |
| `actualSuppressed` | `true` when the value is a suppressed zero |
| `target` | Number, `{ min, max }` range, or `null` |
| `outcome` | Machine-readable target outcome |
| `outcomeLabel` | Localized outcome, for example _Target met_ |
| `targetDifference` | Structured difference from the target, or `null` |
| `baselineDifference` | Structured difference from the baseline, or `null` |
| `announcement` | The full sentence announced to screen reader users |

Differences are in whole percentage points for percent charts, whatever `percentScale` is.

### `a11y-target-line-chart-settings-change`

Fires once for each display setting a reader changes through the chart's own controls or legend. Property and attribute changes from your code never fire it, so it's safe to use for saving reader preferences:

```ts
chart.addEventListener('a11y-target-line-chart-settings-change', (event) => {
	save(event.detail.setting, event.detail.value);
});
```

| Field | Type |
| --- | --- |
| `setting` | A key of the chart's `config` |
| `value` | The new value |
| `source` | `'controls'` or `'legend'` |

A legend action that changes both series fires two events. When the event fires, `chart.config` already includes the change.

## Grouped bar chart only

### `a11y-bar-chart-group-selection-change`

| Field | Type |
| --- | --- |
| `sectionId` | Selected section ID |
| `viewId` | Selected view ID |
| `origin` | `'user'`, `'property'` (your code set it), or `'fallback'` (the selection disappeared from new data) |

See [Grouped bar chart](/charts/grouped-bar-chart/).
