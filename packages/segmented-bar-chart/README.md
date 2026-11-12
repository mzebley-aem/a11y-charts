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

For unbundled use, load `styles.css` and the standalone `chart.js`. The package root exports the element and registration function without registering automatically; `/define` registers the same constructor. `/core` supplies DOM-free validation, model building, formatting, CSV, and XLSX exports.

`config.mode` is `breakdown` (default) or `comparison`. A breakdown infers its total only from complete, safe rows; an explicit total must match a complete breakdown. It never invents a remainder. A comparison requires exactly one row and an explicit reference total; values exceeding that total retain their actual percentage while the visible bar is capped at the track. Missing or suppressed values do not produce proportional segment geometry. Set `valueSuppressed: true` to protect an individual value; `suppressed` preserves the shared charts' legacy zero suppression. Protected values are redacted from the public data getter, model, tables, and exports.

`config.presentation` selects `full` (default) or `compact`, and `highlightedId` selects the prominent full-view value. `valueLabel` and `totalLabel` name the measure and reference total. `href` makes the title a native link; a compact chart without action or detail controls extends that link over the card. Set `showDetails` to enable hover/focus previews and click, touch, Enter, or Space to keep a category card open. Escape dismisses it.

The chart supports the shared visibility options `showSummary`, `showContext`, `showActions`, `showExplanation`, `showGlossary`, `showExport`, `showCounts`, `showPercentages`, `showTotal`, `tableVisibility`, `dataView`, `explanationExpanded`, and `glossaryExpanded`. Set `context`, `explanation`, and `dataNote` to supported safe rich HTML. `messages`, `locale`, decimal settings, and `formatValue` customize presentation. Exports use the same protected semantic model as the chart.

Use `theme.segments[id]` to assign a stable category's `color`, `pattern` (`none`, `diagonal`, `dots`, or `horizontal`), and `patternColor`; shared theme properties and `--a11y-segmented-bar-chart-*` CSS custom properties adjust the surrounding chart. The element emits `a11y-segmented-bar-chart-ready`, `-data-change`, `-display-change`, `-data-view-change`, `-disclosure-change`, and `-error` events.

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

## Shared contracts

- Standard attributes: `chart-title`, `subtitle`, `locale`, `heading-level`, `filtered`, `suppressed`, and JSON `messages`. Boolean attributes use presence semantics. `href` is optional; omitting it creates a chart without navigation.
- Rich `context`, `explanation`, `dataNote`, and category `definition` use the shared sanitization allowlist. Labels and custom formatter output remain text. Author-supplied narratives must remain consistent with the data.
- `formatValue` receives `{ value, series, locale, id?, label? }`, where `series` is `count`, `percentage`, or `total`. Percentages are fractions, not percentage points. Invalid formatter output falls back to locale formatting. Protected values never reach the formatter.
- Default locale is `en-US`, with zero count decimals, two percentage decimals, heading level 2, dialog data view, and details disabled. `messages` uses shared names such as `showData`, `countHeader`, `percentageHeader`, `detailsPreview`, and `detailsPinned`; `ENGLISH_MESSAGES` and `MessageKey` expose the complete catalog.
- `showActions` controls the main action strip. An explicit inline data view retains its own data tools. `tableVisibility: 'hidden'` removes data access and exports. Hiding numeric annotations never hides missing/suppressed status.
- CSV exports formatted values with formula-safe text and CRLF records. Excel exports numeric reported values and percentage fractions, with protected/missing values as text. Both support authored metadata. DOM-free helpers accept `contextText`, `explanationText`, and `dataNoteText`; rich HTML metadata conversion requires a DOM.
- Chart rendering uses Light DOM and namespaced, component-scoped CSS. Shared controllers are compiled into the independent package. No framework, charting engine, or separately loaded shared runtime is required.

## Verification

Run `npm test --prefix packages/segmented-bar-chart`, `npm run typecheck --prefix packages/segmented-bar-chart`, and `npm run build --prefix packages/segmented-bar-chart` from the repository root. The build verifies the packed artifact in a fresh Node/TypeScript consumer. `npm run browser:segmented` exercises the rendered gallery; `npm run browser:dispute-resolution` checks report adoption.

WCAG 2.2 AA is the release floor, with AAA improvements tracked separately. Automated accessibility and keyboard/browser checks are supporting evidence; hands-on assistive-technology and participant validation are still required before making a conformance claim for a consuming page.

### Grouped display

Breakdowns show at most four segments. With more than four categories, the default `segmentOrder: 'value'` displays the three largest reported values and combines the rest as **Other categories**; ties retain source order and missing or suppressed values sort after reported values. Use `segmentOrder: 'source'` or `'label'` to select in source or locale-aware label order instead. Automatic grouping leaves four or fewer categories in their original order. If a highlighted category would be grouped, the chart reports a configuration error; choose an order or explicit selection that keeps it separate.

Set `separateCategoryIds` to an ordered array of up to three unique, nonempty IDs to choose the separate categories explicitly, even with four or fewer categories. An empty array groups all categories; IDs absent from the current data are skipped without filling their places. Include `highlightedId` in that array when both are set. Comparison mode ignores grouping options.

Other is reported only when all its members are reported; otherwise its value and percentage are withheld. An incomplete breakdown does not draw proportions. The complete data view, original rows, CSV, and Excel exports retain the original categories and order. Use `messages.otherCategories` to localize the aggregate label and `theme.other` to style it independently from source category IDs. Custom value formatters receive aggregate values without a source `id` or `label`.

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
