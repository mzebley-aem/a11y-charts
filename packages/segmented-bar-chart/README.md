# Accessible segmented bar chart

A framework-free custom element for a single proportional breakdown or a value compared with a reference total. Load the stylesheet and register the element:

```js
import '@a11y-charts/segmented-bar-chart/styles.css';
import '@a11y-charts/segmented-bar-chart/define';

const chart = document.querySelector('a11y-segmented-bar-chart');
chart.chartTitle = 'Children served';
chart.data = [
  { id: 'first', label: 'First group', value: 30, definition: 'Description of this group.' },
  { id: 'second', label: 'Second group', value: 70 }
];
chart.total = 100;
chart.config = { highlightedId: 'first', showDetails: true };
```

For unbundled use, load `styles.css` and the standalone `chart.js`. The package root exports the element and registration function without registering automatically; `/define` registers the same constructor. `/core` supplies DOM-free validation, model building, formatting, and CSV export helpers.

`config.mode` is `breakdown` (default) or `comparison`. A breakdown infers its total only from complete, safe rows; an explicit total must match a complete breakdown. It never invents a remainder. A comparison requires exactly one row and an explicit reference total; values exceeding that total retain their actual percentage while the visible bar is capped at the track. Missing or suppressed values do not produce proportional segment geometry. Suppression is controlled by one chart-level flag described under [Suppression](#suppression).

`config.presentation` selects `full` (default) or `compact`, and `highlightedId` selects the prominent full-view value. `valueLabel` and `totalLabel` name the measure and reference total. `href` makes the title a native link; a compact chart without action or detail controls extends that link over the card. Set `showDetails` to enable hover/focus previews and click, touch, Enter, or Space to keep a category card open. Escape dismisses it. With details enabled, the arrow keys, Home, and End move focus between category triggers; ArrowDown and ArrowRight go forward, ArrowUp and ArrowLeft go back, and movement stops at the first and last category.

The chart supports the shared visibility options `showSummary`, `showContext`, `showActions`, `showExplanation`, `showGlossary`, `showExport`, `showCounts`, `showPercentages`, `showTotal`, `dataView`, `explanationExpanded`, and `glossaryExpanded`. Set `context`, `explanation`, and `dataNote` to supported safe rich HTML. `messages`, `locale`, decimal settings, and `formatValue` customize presentation. Exports use the same suppressed semantic model as the chart.

`config.dataView` selects the complete-data presentation: `dialog` (default) adds a View complete data action that opens a modal, `inline` expands a table under the chart, and `none` removes the data table, the data action, and the CSV export. Choosing `none` closes an open dialog. The `data-view` attribute (`dialog`, `inline`, or `none`) takes precedence over `config.dataView` when its value is valid; an invalid value is ignored. The `a11y-segmented-bar-chart-data-view-change` event reports only `dialog` or `inline`. `config.percentScale` (`whole` by default, or `fraction`) and the matching `percent-scale` attribute control the percentage passed to `formatValue`, described under Shared contracts.

Use `theme.segments[id]` to assign a stable category's `color`, `pattern` (`none`, `diagonal`, `dots`, or `horizontal`), and `patternColor`; shared theme properties and `--a11y-segmented-bar-chart-*` CSS custom properties adjust the surrounding chart. The element emits `a11y-segmented-bar-chart-ready`, `-data-change`, `-data-view-change`, `-disclosure-change`, and `-error` events. The segmented bar chart has no reader-changeable settings, so it does not fire a settings-change event; the line chart does. An invalid `messages` attribute dispatches an `-error` with code `invalid-messages`; the message text is still looked up by the `invalidMessages` key.

The standalone gallery example is served from `demo-gallery/segmented/` using the repository gallery scripts.

## Reference comparisons and unavailable data

```js
chart.config = { mode: 'comparison', showDetails: true, percentageDecimals: 1 };
chart.data = [{ id: 'meetings', label: 'Meetings held', value: 251 }];
chart.total = 614;
chart.valueLabel = 'Meetings';
chart.totalLabel = 'complaints filed';
```

This displays 251 against a reference of 614 (40.9%). The unfilled track has no category, legend entry, or exported row. Different reporting units must be explained in authored context; the component does not infer a one-to-one relationship or an outcome for the difference.

For a true subset, supply both the subset and an explicitly named remainder as data records. The report uses 43 pending-hearing complaints and 208 other pending complaints with a total of 251. A complete breakdown whose values disagree with its total produces an error, not a silently rescaled graphic. Missing values (`null`) and suppressed values retain status text. An incomplete breakdown does not draw proportions; a zero denominator has no percentage. `inferTotal: false` keeps an unspecified total unknown.

## Suppression

The host suppresses values upstream, before they reach the chart. It replaces each protected value with `0` and sets the `suppressed` property or attribute once for the chart. The chart never decides which values are protected; it only changes how zeros are displayed. A `null` value always means missing ("Not reported"), whatever the flag.

| Input | Flag on (`suppressed`) | Flag off |
| --- | --- | --- |
| Value `0` | Listed with no visible segment. Value, percentage, legend, details, table, CSV, and the data-change event read as suppressed (`value: null`, `status: 'suppressed'`). The raw zero never reaches `formatValue`. | A real zero: shown as `0` with status `reported`, and still listed with no visible segment. |
| Value `null` | Not reported (`status: 'missing'`). | Not reported. |
| Provided total `> 0` | Shown. Percentages for non-suppressed rows use it. | Shown and used as usual. |
| Provided total `0` | Reads Suppressed; not exposed as a number. | Shown as `0` with the zero-total warning. |
| No total, at least one suppressed row | No inferred total; "incomplete" messaging. | Zeros are real values, so the total is inferred when the breakdown is complete. |
| Flag on, no zero rows | Total inferred normally. | Total inferred normally. |

With the flag on, the chart also shows the Suppressed indicator beside the title and a suppression note above the complete data table in the dialog and inline views. The note uses the `suppressionNote` message, which can be overridden through `messages`. The note is not part of the CSV.

## Shared contracts

- Standard attributes: `chart-title`, `subtitle`, `locale`, `heading-level`, `filtered`, `suppressed`, and JSON `messages`. Boolean attributes use presence semantics. `href` is optional; omitting it creates a chart without navigation.
- Presentation attributes: `data-view` (`dialog`, `inline`, or `none`) and `percent-scale` (`whole` or `fraction`). A valid value overrides `config.dataView` or `config.percentScale`; an invalid value is ignored and the config applies.
- Rich `context`, `explanation`, `dataNote`, and category `definition` use the shared sanitization allowlist. Labels and custom formatter output remain text. Author-supplied narratives must remain consistent with the data.
- `formatValue` receives `{ value, series, locale, id?, label? }`, where `series` is `count`, `percentage`, or `total`. For `percentage`, `value` follows `percentScale`: `whole` (the default) passes 45.5 for 45.5%, and `fraction` passes 0.455. The built-in fallback formatting, model `percentage` fields, and segment geometry always remain fractions. Invalid formatter output falls back to locale formatting. Suppressed values never reach the formatter.
- Default locale is `en-US`, with zero count decimals, two percentage decimals, heading level 2, dialog data view, whole percent scale for `formatValue`, and details disabled. `messages` uses shared names such as `showData`, `countHeader`, `percentageHeader`, `detailsPreview`, and `detailsPinned`; `ENGLISH_MESSAGES` (also exported as `ENGLISH_SEGMENTED_BAR_CHART_MESSAGES`) and `MessageKey` expose the complete catalog. Missing values read `Not reported` by default.
- `showActions` controls the main action strip. An explicit inline data view retains its own data tools. `dataView: 'none'` removes data access and exports. Hiding numeric annotations never hides missing/suppressed status.
- CSV exports formatted values with formula-safe text and CRLF records, and support authored metadata. The element's download begins with a UTF-8 byte-order mark (U+FEFF) so spreadsheet apps detect the encoding. `buildSegmentedBarCsv` returns plain text without the mark; server-side users who want Excel to detect UTF-8 should prepend `\uFEFF` themselves. DOM-free helpers accept `contextText`, `explanationText`, and `dataNoteText`; rich HTML metadata conversion requires a DOM.
- Every class the chart renders uses the `a11y-segmented-bar-chart__` prefix (for example `a11y-segmented-bar-chart__legend` or `a11y-segmented-bar-chart__visually-hidden`), and the stylesheet scopes its rules under the element name. Host-page styles that target generic class names such as `.legend` or `.title` do not apply to the chart.
- Chart rendering uses Light DOM and namespaced, component-scoped CSS. Shared controllers are compiled into the independent package. No framework, charting engine, or separately loaded shared runtime is required.

## Verification

Run `npm test --prefix packages/segmented-bar-chart`, `npm run typecheck --prefix packages/segmented-bar-chart`, and `npm run build --prefix packages/segmented-bar-chart` from the repository root. The build verifies the packed artifact in a fresh Node/TypeScript consumer. `npm run browser:segmented` exercises the rendered gallery; `npm run browser:dispute-resolution` checks report adoption.

WCAG 2.2 AA is the release floor, with AAA improvements tracked separately. Automated accessibility and keyboard/browser checks are supporting evidence; hands-on assistive-technology and participant validation are still required before making a conformance claim for a consuming page.

### Grouped display

Breakdowns show at most four segments. With more than four categories, the default `segmentOrder: 'value'` displays the three largest reported values and combines the rest as **Other categories**; ties retain source order and missing or suppressed values sort after reported values. Use `segmentOrder: 'source'` or `'label'` to select in source or locale-aware label order instead. Automatic grouping leaves four or fewer categories in their original order. If a highlighted category would be grouped, the chart reports a configuration error; choose an order or explicit selection that keeps it separate.

Set `separateCategoryIds` to an ordered array of up to three unique, nonempty IDs to choose the separate categories explicitly, even with four or fewer categories. An empty array groups all categories; IDs absent from the current data are skipped without filling their places. Include `highlightedId` in that array when both are set. Comparison mode ignores grouping options.

Other is reported only when all its members are reported; otherwise its value and percentage are withheld. An incomplete breakdown does not draw proportions. The complete data view, original rows, and CSV export retain the original categories and order. Use `messages.otherCategories` to localize the aggregate label and `theme.other` to style it independently from source category IDs. Custom value formatters receive aggregate values without a source `id` or `label`.

The canonical model exposes `rows` for original data and `displaySegments` for
the capped visual. Each display segment has a stable, collision-free `key`, a
`kind` (`category` or `other`), and safe `members`. Source-category segments
retain their original row; generated Other has no source category ID. Other
member percentages use the full chart denominator. Data views and exports never
add an aggregate row that would double-count its members.

If a focused category becomes grouped during an update, keyboard focus moves to
Other's detail button. If the group disappears, focus returns to a surviving
member or the chart heading. Compact charts with navigation and details disabled
keep the whole-card link; provide complete member data at the linked destination.
