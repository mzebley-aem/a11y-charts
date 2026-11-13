# `@a11y-charts/bar-chart`

Framework-free horizontal bar chart package for accessible reporting. The
consumer supplies the current dataset; filtering and selection stay in the
application. See the package demo and the repository's `BAR-CHART-SPEC.md` for
the component contract.

## Use the component

```ts
import '@a11y-charts/bar-chart/define';
import '@a11y-charts/bar-chart/styles.css';
import type { A11yBarChartElement } from '@a11y-charts/bar-chart';

const chart = document.querySelector<A11yBarChartElement>('a11y-bar-chart')!;
chart.chartTitle = 'By Sex';
chart.data = [
  { id: 'male', label: 'Male', value: 14 },
  { id: 'female', label: 'Female', value: 13 }
];
chart.total = 27;
chart.filtered = false;
chart.suppressed = false;
chart.config = { dataView: 'dialog', scaleMode: 'largest', locale: 'en-US' };
chart.messages = { showData: 'View data', total: 'Population total' };
```

```html
<a11y-bar-chart chart-title="By Sex" heading-level="2"></a11y-bar-chart>
```

Complex inputs use properties. Simple attributes include `chart-title`,
`subtitle`, `locale`, `heading-level`, `data-view`, `percent-scale`,
`filtered`, and `suppressed`. Boolean
attributes follow HTML presence semantics: remove the attribute for false.
The `messages` attribute accepts a JSON object of string overrides. Malformed
JSON or a non-object root displays a localized configuration error; updating
the attribute or the `messages` property recovers the view.

`config.dataView` is `dialog`, `inline`, or `none`. A valid `data-view`
attribute (`dialog`, `inline`, or `none`) takes precedence over `config.dataView`,
the same way `locale` and `heading-level` attributes take precedence over config.
An open view stays usable when data
changes; dialog updates preserve the same modal and focused control. Glossary
and explanation visibility are per-instance preferences. The `suppressed` flag changes only how zero
values read; see [Suppression and shared scales](#suppression-and-shared-scales).
The filtered flag adds an indicator and keeps numeric zeros visible. Supply an
authoritative `total` when available, especially for suppressed data.

## Experimental category cards

Set `config.showDetails = true` to explore category cards similar to the line
chart's value card. The default is `false`; the standalone demo enables the
experiment and includes an **Explore hover and focus cards** switch.

- Hover a category or focus its bar button to preview its count, population
  share, and any target/range interpretation. Values remain available in the
  chart and complete data view.
- Range cards show a green **Target met** badge when the reported value is
  inside the inclusive bounds, and a red **Target not met** badge when below
  or above them, matching the line chart's range logic. The outcome is also
  included in the bar button's accessible name. Missing/suppressed comparisons
  have no outcome badge. Numeric targets use `positiveDirection` (`above` by
  default, matching line charts); equality always meets the target.
- Click, tap, Enter, or Space keeps that card open. Activate the bar again,
  press Escape, or interact outside the category to dismiss it.
- Moving into the card keeps it open, with a continuous pointer path and no
  reading timeout. Keyboard focus takes precedence over incidental hover.
- Tab follows ordinary document order directly from bar to bar; cards have no
  Close buttons or other keyboard stops, matching the line chart cards.
  Leaving a pinned category with the keyboard closes its card. Escape on the
  bar retains focus and does not reopen the preview.
- Cards float near their category on wide screens and join the reading flow
  at 36rem and below. When a wide-screen card cannot fit above or below its
  category in the viewport, it also joins the reading flow.

These are nonmodal disclosure regions, with native toggle buttons exposing
expanded and pinned (pressed) state. They use the same semantic model and
formatter as the other views, including suppressed/missing values. Counts and percentages remain available in cards when their visual
bar annotations are hidden. Definitions stay in the existing glossary.

The component message keys are `detailsAction`, `detailsHint`, `detailsHelp`,
`detailsPreview`, `detailsPinned`, `outcomeMet`, and
`outcomeNotMet`. Each is translated in the
demo's English, French, and Spanish catalogs. Cards add no motion and are
omitted from print output. Data/config changes replace any preview; focus on a
replaced bar returns to the same category by stable ID, or the existing
chart action fallback if that category is removed.

Locally checked with package tests, typecheck, package/demo builds,
and Chromium pointer, keyboard, emulated touch, 320px/375px layouts, forced
colors, reduced motion, and accessibility-tree inspection. Actual screen reader
and participant testing remain release gates; this is an exploratory pattern.

## Events

Component events bubble:

- `a11y-bar-chart-ready`: initial usable render.
- `a11y-bar-chart-error`: validation/configuration failure with `code`,
  localized `message`, and copied data.
- `a11y-bar-chart-data-change`: replaced data/total/error state with copied
  `data` and a semantic `model` (null for unavailable data).

The bar chart has no reader-changeable settings, so it does not fire a
settings-change event; the line chart does.

`announceChanges: false` suppresses automatic live announcements without
disabling the data-change event. The component does not filter or sort the
supplied records and does not store preferences in global localStorage.

The package root exports the element-facing model types and pure helpers:
`resolveConfig`, `validateBarData`, `validateBarTotal`, `buildBarModel`,
`renderRichContent`, `richContentToText`, and `buildBarCsv`. English defaults
are exported as `ENGLISH_BAR_CHART_MESSAGES` (with `ENGLISH_MESSAGES` kept as
a compatibility alias of the same object); `MessageKey` and `MessageDictionary` list
the supported message keys, and `formatMessage` formats whole templates with
named placeholders. Plurals use whole-string keys such as
`summaryAllZero.one` and `summaryAllZero.other`, selected by
`Intl.PluralRules`. Translation dictionaries can override any of
`.zero`, `.one`, `.two`, `.few`, `.many`, or `.other`; missing forms fall back
to `.other`. Omitted or
non-string message overrides use the English fallback.

`A11yBarChartDatum` records have a stable non-empty `id`, string `label`,
nonnegative finite `value` or `null`, and optional rich-text `definition`.
`validateBarData` returns a defensive copy and machine-readable validation
codes. `buildBarModel` preserves order and applies zero suppression, missing
value, total, percentage, and scale rules consistently. `buildBarCsv` exports
the model's displayed values, protects spreadsheet formula-like labels, and
uses CRLF records. It returns text without a byte-order mark; the element's
download prepends a UTF-8 byte-order mark so spreadsheet applications detect
UTF-8. Server-side callers that want spreadsheet applications to detect UTF-8 should prepend
`\uFEFF` to the string themselves.

Pass validated data to `buildBarModel`. When called directly with an invalid
supplied total, it treats the total as unavailable and adds the localized
total validation warning to `model.warnings`.

Configuration defaults to largest-value scaling, a dialog data view, whole-percent
formatter values, `en-US`, zero count decimals, two percentage decimals, heading level 2, and change
announcements. Invalid locales and out-of-range decimal settings fall back to
those defaults. Rich HTML supports paragraphs, emphasis, lists, line breaks,
and safe links; scripts, styles, embedded content, event/style attributes, and
unsafe URL schemes are removed.

```sh
npm test --prefix packages/bar-chart
npm run typecheck --prefix packages/bar-chart
npm run build --prefix packages/bar-chart
npm run demo:build --prefix packages/bar-chart
```

## Message keys

`title`, `subtitle`, `filtered`, `suppressed`, `empty`, `invalidData`,
`invalidMessages`, `total`,
`totalUnavailable`, `totalSuppressed`, `countHeader`, `percentageHeader`,
`categoryHeader`, `contextLabel`, `dataNoteLabel`, `csvContextLabel`,
`csvDataNoteLabel`, `csvCategoryHeader`, `csvCountHeader`, `csvPercentageHeader`,
`csvTotalHeader`, `percentageUnavailable`, `percentageSuppressed`,
`definitionToggle`, `explain`, `hideExplanation`, `showData`,
`close`, `dataDialogTitle`, `dataTableCaption`, `dataInlineSummary`,
`exportCsv`, `scaleLargest`, `scalePopulationShare`, `missingValue`,
`suppressedValue`, `suppressionNote`, `noDefinitions`, `glossary`, `hideGlossary`, `noContext`, `summaryNoData`,
`summaryAllZero.zero`, `summaryAllZero.one`, `summaryAllZero.two`,
`summaryAllZero.few`, `summaryAllZero.many`, `summaryAllZero.other`, `summaryTotal`,
`summaryCategoryShare`, `summaryCategoryValue`, `summaryLargestCategory`,
`summaryLargestCategoryShare`, `summaryTiedLargestCategories`,
`summaryTiedLargestCategoriesShare`, `summaryReportedCategory`,
`summaryNoReportedValues`, `explanationTotal`,
`explanationTotalUnavailable`, `explanationDifference`,
`validationInvalidData`, `validationDuplicateId`, `validationEmptyId`,
`validationInvalidLabel`, `validationInvalidValue`, `validationInvalidRecord`,
`validationInvalidTotal`, `warningTotalMismatch`, `warningComputedTotalOverflow`,
`warningReportedSumOverflow`, `warningPercentageOverflow`,
`announcementDataUpdated.zero`, `announcementDataUpdated.one`,
`announcementDataUpdated.two`, `announcementDataUpdated.few`,
`announcementDataUpdated.many`, `announcementDataUpdated.other`,
`announcementDataError`, `narrativeValue`, `narrativeShare`,
`narrativeMissing`, `narrativeSuppressed`, `narrativeContext`, and
`scaleWarning`.

## Visibility, theme, and formatting options

`dataView: 'none'` removes the complete data surfaces: the Data action, the
dialog and inline table, and the CSV export. An open dialog is closed. The
dialog and inline modes keep a screen-reader-only background table available,
and opening the dialog or inline disclosure presents a separate, visible
complete table. In inline mode, the disclosure and its CSV action stay available
independently from the chart action strip. Hiding summary, counts,
percentages, or total affects the visual category list only; missing and
suppressed status labels remain visible even when both numeric annotations are
hidden. The complete table and CSV retain all supplied values. The
screen-reader-only background copy contains only the table; authored context
and data notes appear in explicit dialog or inline views so rich links never
create invisible keyboard stops.

`showSummary`, `showContext`, `showActions`, `showExplanation`,
`showGlossary`, and `showExport` default to `true`; `showCounts`,
`showPercentages`, and `showTotal` also default to `true`. The
`explanationExpanded` and `glossaryExpanded` options set disclosure preferences
when their input values change. Otherwise, user-opened state survives data and
unrelated configuration updates.

`context` and `dataNote` accept plain text or supported sanitized rich HTML.
Both appear in dialog and inline full-data views; authored content is converted
to plain text in CSV metadata rows. `theme` accepts typed token overrides that
map to the documented `--a11y-bar-chart-*` custom properties. `formatValue`
receives `{ value, series, locale, id?, label? }` and can format count,
percentage, target (including each range bound), and total values consistently in the visual list, summary, table,
and CSV. Missing or suppressed category values are not passed to a custom
formatter; empty, thrown, and non-string formatter results use canonical
locale formatting.

Percentage formatter values use the whole-percent scale by default: `45.5`
means 45.5%. Set `config.percentScale` (or the `percent-scale` attribute) to
`fraction` to receive the population fraction instead (`0.455`), which matches
`Intl.NumberFormat` with `style: 'percent'`. `percentScale` changes only the
`formatValue` input; built-in fallback text, the model's `percentage` fields,
and bar ratios stay fractions. Count/total formatter values are the original
numeric count; total contexts have no category ID or label. The whole-percent
default matches line's percent measure scale.

Theme keys are `color`, `targetColor`, `positiveColor`, `negativeColor`,
`positivePatternType`, `negativePatternType`, `positivePatternColor`,
`negativePatternColor`, `track`, `text`, `muted`, `border`, `focus`, `surface`,
`space`, `font`, `barHeight`, `borderRadius`, `buttonRadius`, `fontSize`,
`titleFontSize`, `lineHeight`, `gap`, `rowGap`, `buttonPadding`, `patternType`,
and `patternColor`. `patternType` accepts `none` (solid, the default), `diagonal`,
`dots`, or `horizontal`, matching the line chart's named patterns. Other values are
CSS strings; use units such as `rem` or `px` for lengths. Explicit object values
override CSS tokens on the chart and persistent data dialog; removing an
override restores CSS control.

```ts
chart.theme = {
  color: '#6b2f75', track: '#efe2f2', barHeight: '2.5rem',
  patternType: 'diagonal', patternColor: '#ffffff'
};
chart.formatValue = ({ value, series, locale }) => series === 'percentage'
  ? new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(value / 100)
  : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);
```

Textures apply to every bar in the chart and update when `theme` changes. They
are decorative: category labels, counts, percentages, tables, and CSV retain
the same values. Unknown pattern names fall back to solid. Texture marks use
`patternColor` (translucent white by default); choose a color that contrasts with
the base `color`. In forced-colors mode, bars and texture marks use system
Highlight and HighlightText colors. CSS consumers can also set
`--a11y-bar-chart-pattern-color`, `--a11y-bar-chart-pattern-image`, and
`--a11y-bar-chart-pattern-size`; a custom image can use `currentColor` for its marks.

`a11y-bar-chart-data-view-change` bubbles `{ open, dataView }` when a dialog or
inline disclosure changes state. `dataView` is `dialog` or `inline`; `none`
never opens a view. `a11y-bar-chart-disclosure-change` bubbles
`{ disclosure, expanded }` when the explanation or glossary is toggled.

## Locale and application content

`locale` and `messages` localize text owned by the component, including its
controls, status labels, table headings, summaries, validation messages, and
CSV headings. A partial `messages` dictionary intentionally falls back to the
English catalog. Applications that offer a language switch should provide a
complete dictionary for that language, including plural variants, to avoid
mixed-language component UI.

The component does not translate application-owned content. The host must
update the document language and localize chart titles, subtitles, category
labels, definitions, context, and surrounding page copy when the selected
language changes. `locale` also controls number and percentage formatting; it
does not infer translations for supplied data. The demo includes complete
English, French, and Spanish component catalogs and host-authored chart/page
content as working examples.


## Target-based bar colors and textures

Use `config.targetStyle` to opt into `color`, `texture`, or
`color-and-texture`. The default `none` retains the standard bar theme. Only
bars with a reported value and an available target receive outcome styling.
Missing/suppressed values and bars without a target keep
the standard treatment. General `patternType` still applies to ordinary bars;
color-only mode changes the fill color and retains that general texture.

```ts
chart.config = {
  ...chart.config,
  targetStyle: 'color-and-texture',
  positiveDirection: 'above'
};
chart.theme = {
  ...chart.theme,
  positiveColor: '#127c25',
  negativeColor: '#c62828',
  positivePatternType: 'dots',
  negativePatternType: 'diagonal',
  positivePatternColor: '#ffffff',
  negativePatternColor: '#ffffff'
};
```

Those example colors and pattern types are the defaults. Pattern-mark colors
default to 75% white. Both pattern types accept `none`, `diagonal`, `dots`, or
`horizontal`, independently of the general `patternType`. Removing theme
overrides restores CSS control. The CSS tokens are
`--a11y-bar-chart-positive-color`, `--a11y-bar-chart-negative-color`, and each
state's `-pattern-color`, `-pattern-image`, and `-pattern-size` tokens.

Ranges pass at either endpoint or anywhere between them; values outside fail.
Numeric targets pass at equality and use `positiveDirection: 'above' | 'below'`
to decide which side passes. Direction defaults to `above`, matching line
charts, and never changes range logic. Comparisons use original values before
rounding or custom formatting. The semantic row's `targetOutcome` (`met`,
`not-met`, or `unavailable`) and localized `targetOutcomeLabel` drive both bar
appearance and card badges. The narrative includes available outcomes too.

When target styling is enabled, explicit **Target met** / **Target not met**
text stays beside each comparable bar even with cards or numeric annotations
disabled. Color is never the only outcome cue. Forced colors use the user's
system palette, retain textures, and preserve the outcome text. Cards add no
Tab stops. The demo exposes the four modes, independent colors/textures, and
numeric direction in all three languages.

## Numeric targets and target ranges

Each category accepts an optional `target: number | { min: number; max: number } | null`,
matching the line chart's target shape. Bounds are inclusive, finite and nonnegative,
with `min <= max`, and use the same units as `value`. Omitted/null targets mean
not set. Equal bounds draw a single marker while retaining both bounds in text.

```ts
chart.data = [
  { id: 'a', label: 'Category A', value: 45, target: { min: 40, max: 50 } },
  { id: 'b', label: 'Category B', value: 15, target: 20 }
];
```

The reported value remains the solid/textured bar. A dashed outline shows a
range; a dashed vertical marker shows a numeric target. The outline has
0.5rem of vertical clearance above and below the bar, with space reserved
in the row so it cannot collide with category labels or comparison text. Set
`--a11y-bar-chart-target-offset` to adjust that clearance. Visible text gives the
bounds and reports below/within/above, or equality for a numeric target. Range
cards additionally show met/not-met outcomes as described above. Numeric
targets use the configured positive direction. Missing or suppressed values have no comparison.
Target text stays visible when counts/percentages are hidden. The generated
summary includes the first target comparison; Explain includes every category's
comparison. The semantic row exposes `target`, `targetText`,
`targetRelation`, `targetOutcome`, `targetOutcomeLabel`, `targetNarrative`,
`targetStartRatio`, and `targetEndRatio`.

Targets never contribute to totals, percentages, or largest-category rankings.
`largest` scaling includes the highest visible target bound so the full target
fits. `population-share` uses the supplied/computed total: markers are clamped
and a localized warning explains targets beyond the total. Without a positive
total, the marker is omitted and its target text remains available. A zero target
on an all-zero largest-value scale is drawn at the origin.

Targets are never suppressed. A target of `0` is the numeric
zero and is shown as `0` whether or not the chart's `suppressed` flag is on.
Range inputs, getters, semantic models, and event payloads are defensively copied.

A Target column appears in each complete data table and CSV when any row has a
target. Other rows say Not set; total rows have no target.
Without targets, table/CSV columns remain unchanged. Target changes use the
existing data-change announcement/event and preserve an open dialog and focus.

`formatValue` receives `series: 'target'` separately for each bound, using the
same category ID/label and fallback number formatting as counts. Use
`theme.targetColor` or `--a11y-bar-chart-target-color` for the outline/marker
(default `#172b3a`); forced-colors mode uses system colors.

Additional message keys: `targetHeader`, `csvTargetHeader`, `targetUnavailable`,
`targetRange` (`{min}`, `{max}`), `targetBelow`, `targetWithin`,
`targetAbove`, `targetEqual`, `targetIncomplete` (`{label}`, `{target}`),
`warningTargetClipped`,
`warningTargetScaleUnavailable` (`{label}`), and `validationInvalidTarget` (`{id}`).
The French and Spanish demo catalogs include these keys. The Reporting status
example demonstrates range, numeric, and missing-value comparisons.

## Server helpers and CSV metadata

Import pure helpers from `@a11y-charts/bar-chart/core` in Node or SSR code. The
normal package entry exports the browser element and requires DOM globals.
The build checks the `./core` entry in a separate Node process.

CSV `contextText` and `dataNoteText` are already-plain text and work without a
DOM. They override the HTML `context` and `dataNote` options, including when
explicitly set to an empty string. Rich HTML metadata still uses the browser
allowlist; passing it without a DOM throws a descriptive error. CSV formula
protection applies to metadata as well as data cells.

## Modal failure and reconnect behavior

Disconnect closes an open data dialog; reconnect restores it through the native
modal API. Data-view events track those closed/open transitions. Delayed close
events from the old lifecycle cannot close the public state of a reopened dialog.
If the browser cannot open a native modal, the chart emits an error and displays
a localized alert (`dialogUnsupported` or `dialogUnavailable` messages); it does
not substitute a nonmodal dialog. Applications can select `dataView: 'inline'`
for environments without native dialog support.

The ready event includes `{ instanceId }`, matching the line chart. Data-change
events describe changed state after initial rendering;
equivalent assignments do not produce an additional event, and same-turn
updates coalesce. Chart-specific payload fields remain distinct.


## Independent browser distribution

`npm run build` creates `dist/chart.js` (registering classic script),
`dist/styles.css`, and the ESM API/registration/core entries. Load the script and
stylesheet together; no shared-core script or separately installed rendering
library is required. Shared source utilities and UI primitives are compiled into
each package. The `./core` export supports DOM-free data processing; root and
`./define` require a browser. Each build checks its npm archive in a fresh consumer
for runtime and TypeScript resolution. See the repository's
[architecture document](../../SHARED-CORE-DISCUSSION.md) for integration examples.

## Grouped population views

Importing `/define` now also registers `<a11y-bar-chart-group>`. The same
stylesheet includes its responsive selector layout. It uses native radio
controls and section disclosure buttons around one persistent bar chart.
Selection changes update title, context, explanation, data, total, and status
flags together. Existing Explain/Glossary preferences and an open Data view
survive selection updates. At narrow widths the selector appears above the chart.

```ts
import '@a11y-charts/bar-chart/define';
import '@a11y-charts/bar-chart/styles.css';
import type { A11yBarChartGroupElement } from '@a11y-charts/bar-chart';

const group = document.querySelector<A11yBarChartGroupElement>('a11y-bar-chart-group')!;
group.config = { scaleMode: 'largest', scaleMaximum: 322 };
group.sections = [{
  id: 'race', label: 'Race/ethnicity', allViewId: 'all-populations',
  description: 'Choose a population to see its data.',
  views: [{
    id: 'all-populations', label: 'All Race/Ethnicities',
    chartTitle: 'All Race/Ethnicities', total: 510,
    filtered: false, suppressed: true,
    context: '510 children in the overall population.',
    data: [
      { id: 'home', label: 'Home', value: 322 },
      { id: 'community', label: 'Community-Based Setting', value: 0 },
      { id: 'other', label: 'Other Setting', value: 0 }
    ]
  }, {
    id: 'black', label: 'Black or African American',
    chartTitle: 'Black or African American', total: 102,
    filtered: true, suppressed: true,
    context: '102 children: 20% of the overall population of 510.',
    explanation: '<p>Home represents 100% of the selected population.</p>',
    data: [
      { id: 'home', label: 'Home', value: 102 },
      { id: 'community', label: 'Community-Based Setting', value: 0 },
      { id: 'other', label: 'Other Setting', value: 0 }
    ]
  }]
}];
```

`selectedSectionId` and `selectedViewId` expose/control selection. Section and
view IDs must be stable across translated labels. View IDs are unique within a
section. Selecting a new section chooses its All view; collapsing the active
section preserves the selection. Replacing sections preserves a surviving
selection, falls back to the same section's All when a view disappears, then to
the first section when that section disappears. Invalid inputs show an error;
empty sections collections show an empty state. Authored host children remain.

`a11y-bar-chart-group-selection-change` bubbles `{ sectionId, viewId, origin }`,
where origin is `user`, `property`, or `fallback`. Chart events also bubble
through the companion. Use IDs to connect application URL state or fetching;
the companion accepts synchronous prepared views, and does not fetch data.
Hosts must reject stale asynchronous responses and own their loading/error UI.

Shared `config`, `messages`, `theme`, and `formatValue` are forwarded to the
chart. `groupMessages` overrides selector labels, expand/collapse messages,
empty/error text, and selected-view status. Its exported interface lists keys.
Option labels, definitions, descriptions, and authored content are host-localized.
A view’s optional `emptyMessage` supplies selection-specific no-data guidance.
Each view may supply a `scaleMaximum` override, but a common group-level maximum
is the recommended default for comparison. A prepared view's `total: null`
means unknown; the companion disables total inference. An external report filter
must be included in each view's `filtered` flag, including its All view.

`prepareBarViewSection` is a DOM-free helper for applications adapting raw
records. Supply resolved category IDs/labels/definitions, a `filterId` per row,
ordered options, and authoritative totals. It aggregates repeated categories,
protects aggregates that include a suppressed zero, keeps missing states, supports source or descending
value order, and passes safe copied values to a `describe` callback for authored
localized narratives. `populationShare` uses the full population denominator;
the chart uses the selected `total`. The helper does not parse ADAPT templates
or call its glossary service. Resolve those application concerns before this
boundary. Targets must be supplied after aggregation because summing population
targets is not generally valid.

## Suppression and shared scales

Suppression is one chart-level flag: the `suppressed` property, or the
`suppressed` attribute on `<a11y-bar-chart>`. A group view supplies the same
boolean as its `suppressed` field. The host decides what is protected and
replaces each protected count with `0` before passing data. The chart never
decides what is suppressed; it only changes how zeros are shown.

A value is suppressed if and only if `suppressed` is true and its value is `0`.
A `null` value is always missing ("Not reported"), with or without the flag.
Targets are never suppressed.

| Input | Flag off | Flag on |
| --- | --- | --- |
| `value: 0` | Real zero: shown as `0`, with its percentage and status `reported`. Never hidden. | Suppressed: the row stays, with no bar. Value and percentage read `Suppressed`; status `suppressed`; value `null` in the row, detail card, narrative, table, CSV, getter, and change event. |
| `value: null` | Not reported. | Not reported. |
| Provided `total` > 0 | Shown; percentages computed from it. | Shown; percentages for non-suppressed rows computed from it. |
| Provided `total` = 0 | Shown as `0`; percentages unavailable. | Reads `Suppressed`; percentages unavailable. |
| No total, at least one zero row | Inferred from complete rows when `inferTotal` is on. | Reads `Suppressed`; a computed sum would understate the total. |
| No total, no zero rows | Inferred when `inferTotal` is on. | Inferred normally. |
| Indicator | None. | `Suppressed` indicator next to the title, even when no zero is present. |
| Note | None. | The `suppressionNote` paragraph appears directly above the complete table in the dialog and inline views, and as a CSV metadata row. |

The getter and change-event `data` copies redact each zero to `value: null`
while the flag is on, so the raw count never leaves the chart through them.
`prepareBarViewSection` follows the same rule: an aggregate that includes a
suppressed zero becomes a protected zero, so a partial sum is never reported as
a count. Authored `describe` callbacks also receive redacted zeros.

Customize the note with the `suppressionNote` message key.

`config.scaleMaximum` is an optional positive finite count maximum for `largest`
mode. Bars and targets use this common domain; percentages still use `total`.
Values above the maximum are clamped visually and produce a warning while text
retains the full reported value. `population-share` mode ignores this maximum.
`config.inferTotal` defaults to `true`; set it to `false` when a missing supplied
total must remain unknown even if all supplied rows are reported.

## Authored explanations and CSV

`chart.explanation` accepts the same sanitized rich content as `context`. When
nonempty it replaces the generated list inside Explain. Clearing it restores
generated explanations. The authored text is included in explicit Data views and
CSV metadata. Applications remain responsible for keeping authored narrative
consistent with their supplied numeric data.

Data views offer Download CSV when `showExport` is enabled. The download exports
the formatted display values, carries selected context, authored explanation,
notes, and totals, and begins with a UTF-8 byte-order mark. The package offers
no workbook export; applications that need one can build it from the semantic model.
