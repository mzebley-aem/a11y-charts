# Accessible bar chart and shared chart capabilities

Status: implemented and verified locally October 19, 2026; human assistive
technology release evidence remains outstanding.

The subsequent shared-options implementation is recorded in
[SHARED-CHART-OPTIONS-SPEC.md](./SHARED-CHART-OPTIONS-SPEC.md), including additional
visibility controls, bar theming/formatting, rich line content/disclosures,
CSV for both, explicit line suppression and shared state events. Its evidence
supersedes the earlier test counts below (current total: 132 passing tests).

Build an independent Light DOM `<a11y-bar-chart>` Web Component for highly
accessible IDEA reporting. Preserve the supplied Angular reference's vertical
list of horizontal bars, category labels, adjacent percentages and counts,
explanation, glossary, complete data, and total. Add configurable data dialogs
and complete text customization to the existing line chart as well.

The consuming application owns all filtering and dataset selection. The
component renders the supplied dataset and updates when it changes. A filtered
flag is presentation metadata. The Angular `data-rep-grouped` sidebar is a
reference composition, not an internal filtering requirement. Stacked bars or
multiple adjacent comparison bars are not required by these screenshots.

The optional grouped-view companion added October 22 is documented in
[BAR-CHART-REPLACEMENT-PARITY.md](./BAR-CHART-REPLACEMENT-PARITY.md). It now supplies
reusable selection controls around this chart while the host retains data
preparation and filtering policy. Its APIs extend the original scope below.

## Boundaries and preservation

- New package: `packages/bar-chart`, with `@a11y-charts/bar-chart` exports for
  the element, registration, public types, semantic model, messages, and CSS.
- Existing active line implementation: `packages/line-chart`. Preserve current
  target-range, baseline, formatting, navigation, and ECharts behavior.
- The root Angular application and the external `adapt` checkout are references;
  do not modify them.
- Preserve unrelated working-tree changes. Do not commit, push, publish, or
  deploy as part of implementation.
- New APIs below are implementation decisions within the approved direction;
  document any necessary deviations with their reasons.

## Bar chart public contract

```ts
interface A11yBarChartDatum {
  id: string;                 // stable unique category identity
  label: string;              // resolved display text, not a glossary key
  value: number | null;       // nonnegative finite count; null means missing
  definition?: string;        // ordinary string or supported rich HTML
}

interface A11yBarChartConfig {
  scaleMode?: 'largest' | 'population-share'; // default largest
  dataView?: 'dialog' | 'inline';            // default dialog
  locale?: string;                          // default en-US
  countDecimals?: number;                   // default 0
  percentageDecimals?: number;              // default 2
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;     // default 2
  announceChanges?: boolean;                // default true
}

chart.chartTitle = 'By Sex';
chart.subtitle = 'Reported population and reporting period';
chart.data = [
  { id: 'male', label: 'Male', value: 14 },
  { id: 'female', label: 'Female', value: 13 }
];
chart.total = 27;               // undefined/null means not supplied
chart.filtered = false;
chart.suppressed = false;
chart.context = '<p>Optional authored context with <strong>emphasis</strong>.</p>';
chart.config = { scaleMode: 'largest', dataView: 'dialog', locale: 'en-US' };
chart.messages = {};            // partial key/value override dictionary
```

Support simple attributes `chart-title`, `subtitle`, `locale`, `filtered`,
`suppressed`, and `heading-level`. Boolean attributes use HTML presence
semantics. Complex data, config, messages, and rich content use properties.
Support a `messages` JSON attribute for consumers requiring declarative
key/value configuration; malformed JSON must give a useful localized error
without throwing or leaving stale UI. Property and attribute updates must
coalesce to one coherent render. Do not mutate incoming data or config; return
defensive copies from getters. Registration is idempotent. Preserve authored
children by managing only an explicitly owned root. IDs and relationships are
unique across instances. Preferences are per instance; do not add global
localStorage persistence.

## Values, totals, and scales

Preserve incoming order. Values must be finite and nonnegative or null; reject
negative values, NaN, Infinity, duplicate/empty IDs, and invalid records with a
localized actionable state and an error event. A supplied total must be finite
and nonnegative. An explicit total of zero is not an omitted total.

| Suppressed | Filtered | Zero display | Heading indicators |
|---|---|---|---|
| false | false | 0 | none |
| false | true | 0 | Filtered |
| true | false | Suppressed | Suppressed |
| true | true | Suppressed | Suppressed and Filtered |

Nonzero values remain visible in every case. Suppression indicators follow the
supplied flag even if every displayed value is nonzero. A null is missing,
not zero; do not silently label it Suppressed. Apply the same zero substitution
in bars, summaries, complete data, announcements, and CSV. Suppressed category
rows have no positive bar length and expose no numeric percentage. Filtered
alone never hides or substitutes a zero.

Use the authoritative supplied total for percentages, even if it exceeds the
sum of the visible counts. With no total and suppression off, sum the supplied
numeric values; if any value is missing, the population denominator is unknown
unless the app supplies a total. With suppression on and no total, percentages
are unavailable. A zero denominator produces unavailable percentages, not NaN,
Infinity, or invented 0%. An unavailable total must be labeled unavailable
(or Suppressed when appropriate), not fabricated from protected data.

- `largest`: each non-suppressed numeric value / maximum reported value;
  maximum zero gives zero-length bars.
- `population-share`: each reported value / known positive total; unavailable
  percentages have no implied positive bar length. Clamp visual lengths to the
  track and expose inconsistent value/total inputs clearly rather than drawing
  overflow or altering the numeric source value.
- Percentage labels always use the population total in either mode.
- Counts use 0 and percentages 2 decimal places by default; locale/configuration
  controls formatting.
- Retain all-zero category rows. An empty array is a distinct explanatory empty
  state. Invalid input is distinct from both empty and all-zero data.

## Narrative and rich content

Show a concise generated takeaway beneath title/context. An Explain disclosure
exposes fuller generated explanation and optional authored context. Generate
only verifiable facts: known totals, reported category values/shares, ties and
differences where all needed values are reported. Do not claim a reported
category is the largest of the entire population when other values are missing
or suppressed. One semantic model drives every representation.

Definitions toggle together in place beside their category labels. Omit or
disable glossary controls meaningfully when there are no definitions. Ordinary
strings work without special wrapping. Support paragraphs, emphasis, lists,
line breaks, and links in definitions/context through an allowlist sanitizer.
Never interpolate messages or category labels as HTML. Remove dangerous
elements, event/style attributes and unsafe URL schemes; remove original IDs
to prevent collisions. Rich content must not escape its container. CSV uses
plain text, preserving readable labels and suppression states.

## Localization for both charts

Every component-owned visible and assistive string comes from an exported
English message dictionary. Expose `messages: Partial<Record<MessageKey,
string>>` with English fallback for omitted/invalid entries, and a documented
complete key list. Consumers can set it as a property; accept a JSON `messages`
attribute as well. Runtime message changes update all representations.

Coverage includes titles/default series names, controls, pattern options,
headings, total/missing/suppressed/filtered labels, table/CSV headers, captions,
empty/invalid states, validation messages, navigation instructions, live
announcements, tooltips, baseline and target/range interpretation, summary
sentences and units. Preserve explicit existing label/formatter configuration
as higher-priority overrides. Numeric/locale formatting is separate.

Use whole sentence templates with named `{placeholders}`. Support plural
variants with `.zero`, `.one`, `.two`, `.few`, `.many`, `.other` message keys
selected by `Intl.PluralRules`; never require translators to assemble English
sentence fragments. Unknown placeholders remain safe literal text. No eval,
HTML interpretation, or arbitrary code in templates. Invalid locales fall back
to en-US. English defaults should preserve established line-chart wording and
tests wherever possible; localization must not change its meaning.

## Complete data and live updates for both charts

`dataView: 'dialog' | 'inline'` defaults to dialog. Inline data is a clearly
named native disclosure. Preserve line `tableVisibility`/`showTable` behavior:
explicit hidden/screen-reader modes remain supported; visible full-data access
uses the configured presentation. Document precedence and ensure a visible
Data action exists for the normal default chart.

Use native `<dialog>` with `showModal()`, an explicit close button, an
accessible heading, Escape handling and focus restoration. Test real-browser
background inertness and Tab containment. Tests may mock missing dialog APIs,
but do not let mocks substitute for browser evidence. Prevent document-level
horizontal overflow; dialog content scrolls within the viewport with useful
end padding. Table headers and captions remain semantic. Readable rows/totals
do not become gratuitous Tab stops.

Changing data while a dialog is open must update bars, narrative, table and
export source together, retain that same open dialog, preserve the focused
control, and announce the change once through a polite live region. Do not
replace a focused dialog wholesale. Preserve glossary/explanation preferences
across updates. Coalesce bursts; no initial-render unsolicited announcement.
If the focused item disappears, focus a meaningful stable control in the same
dialog. Handle disconnect/reconnect and mode changes without orphaned modal
state or stale event listeners.

Bar CSV export includes current labels/counts/percentages and a clearly named
total, using the canonical suppression/missing policy. Quote CSV correctly and
neutralize formula-like text labels. Excel is deferred.

## Styling and accessibility

The bar theme supports `patternType: 'none' | 'diagonal' | 'dots' | 'horizontal'`
and a CSS `patternColor`. Textures apply chart-wide, preserve the base bar color,
and update live; solid (`none`) is the default and the fallback for unknown names.
Texture changes preserve data, table values, open dialogs, and keyboard focus.
Patterns remain decorative and use system Highlight/HighlightText colors in
forced-colors mode. Demo texture controls are localized with the other host UI.

Use prefixed Light DOM CSS and public custom properties for color, spacing,
typography, focus and bar dimensions. Match the supplied visual hierarchy:
label above, horizontal bar, adjacent percentage/count, visible total. Bars
are decorative to assistive technology; semantic text provides all data.
Expose filtered/suppressed state in readable text. No bar click action or
required hover interaction. Actual buttons must have visible hover, active,
focus and disabled states. Respect reduced motion; charts remain useful in
forced colors, zoom, narrow viewports, print and with long labels/definitions.
Native controls and logical reading order serve keyboards, speech, screen
readers and refreshable braille.

## Implementation ownership

Work is delegated to three GPT-6 Luna agents, using the current working tree:

1. **Bar core** owns package/tooling, `src/model.ts`, `config.ts`, `messages.ts`,
   `validation.ts`, `semantic-model.ts`, `rich-content.ts`, `csv.ts`, pure
   tests, and the bar README. It must communicate the core API immediately.
2. **Bar UI** owns `src/a11y-bar-chart-element.ts`, `styles.css`, `index.ts`,
   `registration.ts`, `define.ts`, element tests, and bar demo/build assets.
   It consumes the core contract below and coordinates changes with Bar core.
3. **Line capabilities** owns `packages/line-chart` implementation, tests,
   README and demo fixtures for localization and inline/dialog data views.
   It preserves all pre-existing changes and regenerates derived demos.

Root integrates and reviews all work, updates root documentation, runs tests
and browser checks, and fixes integration/accessibility defects. Do not spawn
additional subagents without coordinating available capacity. Do not modify
another stream's files without coordinating ownership.

### Bar core handoff API

Use `resolveConfig(config?) -> ResolvedA11yBarChartConfig`,
`validateBarData(unknown) -> { valid: true; data: A11yBarChartDatum[] } |
{ valid: false; code: string; message: string }`,
`buildBarModel(data, options) -> A11yBarChartSemanticModel`,
`renderRichContent(string) -> DocumentFragment`, and
`buildBarCsv(model, options?) -> string`. Validation errors should expose
machine-readable keys/parameters so UI messages are localizable.

`buildBarModel` options contain optional `total`, `suppressed`, `filtered`,
`config`, and `messages`. It returns rows with `id`, `label`, `value`,
`status: 'reported' | 'suppressed' | 'missing'`, `valueText`,
`percentage: number | null`, `percentageText`, `barRatio` (0–1),
`definition` (string), and `narrative`. Top-level model includes
`total: number | null`, `totalText`, `summary` (string), `explanation`
(string[]), `indicators` (string[]), and validation/warning information as
needed. Export every public type used by the component. Resolve helper naming
changes between the two bar agents before writing dependent UI code.

## Acceptance and evidence

- Both package test suites, typechecks, production builds and self-contained
  demo builds pass. Run `git diff --check`. Update docs and generated fixtures.
- Test value validation, duplicate identities, supplied/omitted/zero totals,
  suppressed zeros and nonzero values, filtered zeros, missing values, scales,
  source immutability, rich-content sanitation and CSV correctness.
- Test multiple instances, English fallbacks, non-English dictionaries with
  sentence/plural reordering, runtime locale/messages changes, JSON attribute
  errors, and translated assistive/validation text.
- Test open-dialog data replacement and focused control preservation, mode
  transitions, reconnection, Escape, focus restoration and no initial chatter.
- Retain all current line range/baseline/navigation tests. Run the complete
  package suites, not only newly written tests.
- Browser proof at desktop, 390px and 320px: no document overflow; labels and
  values readable; modal keyboard containment and focus restoration; coherent
  updates with an open modal; forced colors/reduced motion; no console errors.
- Publish an honest handoff of implemented behavior, test/browser evidence,
  and remaining human screen-reader/braille verification. Local work only.

## Local implementation evidence

Three GPT-6 Luna agents implemented the bar core, bar UI, and line capabilities.
Root integration review corrected Escape focus restoration after live updates,
preserved the open state when switching from a dialog to inline data, and
contained wide inline line-chart tables within their own scroll region.

| Check | Result |
|---|---|
| Bar package tests | 25 passed |
| Line package tests | 75 passed, including the prior target-range coverage |
| Both package typechecks and production builds | Passed |
| Both self-contained demo builds | Passed |
| Line report demo build | Passed; Vite reports a chunk-size advisory |
| Git whitespace check | Passed |
| Real-browser modal updates | Same dialog, same focused Close control, same live region, and native modal state retained in both components |
| Repeated Tab and Shift+Tab | Stayed within each open data dialog |
| Escape after live data replacement | Closed dialog and focused the current Data action in both components |
| Dialog to inline transition | Closed the modal, retained visible open data, and kept focus within the component |
| Inline data updates | Open state retained, no duplicate IDs |
| Desktop, 390px and 320px layout | No document-level overflow; wide tables scroll inside their own region |
| Long unbroken labels and extreme finite counts | Wrapped at 320px; overflowing derived totals/percentages were marked unavailable |
| Forced colors and reduced motion | Browser-emulated media checks completed at 320px with no page overflow |
| Complete line message overrides | Summary, controls, pattern options, tooltip and navigator text used supplied dictionary values |
| French and Spanish demo switches | All four bar examples and all three line examples update component messages, host-authored labels/context, page controls, and document/chart language; numeric data stays unchanged |
| Runtime language changes with an open dialog | Both components retain the dialog, focused Close control and open state while updating its translated contents |
| Translated detail views | Expanded bar explanations/definitions, French CSV headers and values, line data tables, navigation labels and baseline comparisons verified in the browser |
| Localized formatting and errors | Line axis ticks use Intl number formatting; malformed message JSON retains the last valid dictionary and resolves its alert in the current language |
| Browser console | No errors in the combined consumer fixture |

Each package provides its own self-contained `demo/index.html`. Source and
component documentation remain the authoritative API references.

Human screen-reader/refreshable-braille sessions, actual browser zoom and print
review, and a broader browser/assistive-technology matrix remain release gates.
No commit, push, publication, or deployment was performed.


## Target extension — October 21, 2026

Bar data now accepts per-category `target?: number | { min: number; max: number } | null`
and `targetSuppressed?: boolean`, matching the line target shape. The bounds are
inclusive and use the same nonnegative units as the reported value. A range
renders as a dashed outline over the track; numeric/equal-bound targets render
as vertical markers. Visible text states bounds and comparison without assuming
that above/below indicates success. Targets do not enter totals or rankings.
Largest scaling includes visible target bounds; population-share scaling keeps
its total denominator, clamps out-of-bounds markers, and explains clipping or
unavailable positioning. Protected targets are removed from normalized data.

The canonical model supplies comparison text to the visual rows, summary,
explanation, complete tables, CSV, and defensive event data. Target-only updates
retain native dialog state and focus. New types, formatting contexts, theme
tokens, localized message keys, and edge cases are documented in the bar README.
The self-contained package demo includes illustrative targets.

Validation for this extension: 59/59 bar tests and 91/91 unchanged line tests
passed with Node 24.16.0; bar typecheck, package build, standalone demo build,
and `git diff --check` passed. Browser checks verified visible dashed bands,
zero/point targets, localized French comparisons/table headings, desktop and
320px layouts without page overflow, a target-only update while the native
dialog remained modal with Close focused, Tab containment, and Escape focus
restoration. No browser warnings/errors were recorded. Existing human
assistive-technology, forced-colors/print, and broader browser release gates
remain applicable. This change was not committed or deployed.
