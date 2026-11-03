# Angular data-rep replacement: functional parity

Assessment date: October 22, 2026. The inventory below records the initial gaps.
Implementation followed in the same review cycle; see the implementation status
section below for the current local state.
Visual matching is deferred. This assessment does not certify replacement
readiness or live behavior of either application.

## Evidence and scope

Reviewed the supplied `data-rep` and `data-rep-grouped` TypeScript/templates,
`data-rep-wrapper-aria.spec.ts`, and three screenshots against the current
`packages/bar-chart` model, validation, semantic model, element, CSV, README,
and `BAR-CHART-SPEC.md`.

Angular reference directory:
`/Users/mzebley/Documents/GitHub/adapt/libs/adapt-shared-component-lib/src/lib/report-components/`.
Its source is evidence of functionality, not a requirement to reproduce its
implementation. No Angular reference files were changed. The screenshots
demonstrate single-section selectors; the source additionally supports multiple
expandable sections. Production payloads, service/template-parser internals,
and a running Angular integration have not been verified in this assessment.
The comparison component mentioned by the ARIA test is outside the supplied
component scope.

## Initial functional inventory

“Present” below means present in current source, not newly browser-verified.

| Capability | Current replacement | Required disposition |
| --- | --- | --- |
| Horizontal categories, counts, percentages, total | Present | Retain one semantic model across representations. |
| Explain, category glossary, Data dialog/inline view, CSV | Present | Keep disclosures and dialog usable across selection changes. |
| Filtered and suppressed heading indicators | Present | Compose external filtering with local selection. Selecting All must not clear an external filter. |
| Left-side single-choice category filter with All/reset | Missing reusable composition | Add accessible selection UI around the existing chart. |
| Multiple sections with expandable option lists | Missing | Support section IDs, labels, descriptions, explicit order, and independent expansion state. Selecting another section resets to its All view as in the reference. |
| Authored filter order and optional filter definitions | Missing composition | Preserve supplied order and long labels; support definitions independently of bar definitions. |
| Automatic filter discovery, aggregation, category sorting | Host responsibility | Provide a tested ADAPT adapter; keep raw field names and glossary-service logic out of the chart. |
| Selected heading and authored insight | Existing title/subtitle/context inputs; no selection wiring | Update all related content from the same selected view. |
| Custom Explain template | Partial | Generated explanation and authored context exist, but there is no equivalent authored explanation override. Define a dedicated safe content input if production templates must appear specifically within Explain. |
| Selected total and share of the full population | Partial | Chart accepts the selected denominator; host must retain the separate full-population denominator for insight text. |
| Section-wide scale retained across filters | Missing explicit scale-domain input | Decide and document scale policy; current largest mode rescales each supplied dataset. |
| Zero, missing, suppressed values | Partial compatibility | Current chart distinguishes null/missing and global zero suppression; it cannot express arbitrary per-row suppression independently of true zeros. |
| Empty results and authored no-data text | Partial | Existing empty/error/all-zero states exist; adapter/composition must map selection-specific copy without inventing counts. |
| Excel workbook download | Missing | Add optional XLSX export using the same safe semantic data as CSV. CSV opening in Excel is not XLSX parity. |
| Runtime language, heading level, content updates | Present at chart level | Localize selector labels, definitions, state messages, and authored narratives too. |
| Modal state notification | Present under new event API | Map Angular `dataModalStateChange` to `a11y-bar-chart-data-view-change` in integration code. |
| Shared persisted Explain/Glossary preferences | Intentionally different | Current chart uses per-instance preferences. If the application needs persistence, implement it in the host rather than global component storage. |

## Recommended composition

Keep `<a11y-bar-chart>` responsible for rendering **one prepared dataset**.
Add an optional framework-independent grouped-view companion that owns the
selector and a persistent chart instance. This extends the prior spec's host
selection boundary without making every consumer recreate accessible controls.
“Grouped” here means selectable population slices, not clustered or stacked bars.

Use native single-choice radio controls with a labeled fieldset for each active
filter section. These options filter the same chart, so radio semantics describe
the task naturally. Style the labels as a vertical sidebar with visible selected
and focus states. Do not inherit the reference's nested listboxes containing
buttons. If a future use case actually switches independent panels, implement a
complete tabs pattern separately.

Multiple sections use heading/disclosure buttons with `aria-expanded` and
`aria-controls`; choosing a different section activates its All view. Toggling
the already-active section only expands/collapses its options. Collapsing must
not clear its filter. Keep active section and selection evident when collapsed.
Small screens stack the same controls before the chart and retain their meaning.

Suggested data boundary (design sketch, not an exported API):

```ts
interface PreparedBarView {
  id: string;                 // stable ID, independent of translated label
  label: string;
  definition?: string;
  chartTitle: string;
  context?: string;           // prepared, localized insight
  dataNote?: string;
  data: readonly A11yBarChartDatum[];
  total: number | null;       // authoritative selected population
  suppressed: boolean;
  filtered: boolean;          // includes external filter state
}

interface BarViewSection {
  id: string;
  label: string;
  description?: string;
  allViewId: string;          // no reserved literal "all" or label matching
  views: readonly PreparedBarView[]; // explicit order, including All
}
```

The companion should accept sections and selected section/view IDs, expose
the effective selection, and emit a bubbling selection-change event containing
IDs and change origin. Reject duplicate IDs and invalid references. Retain a
valid selection across replacements/reordering/localization; if removed, fall
back deterministically to that section's All view or the first remaining section.
An empty collection has a visible empty state. No source array mutation.

Assign data, total, title, context, and flags synchronously so the chart's existing
microtask render coalesces them. Keep the same chart node and selector controls
where possible. Preserve focus, Explain/Glossary preferences, and open data view.
Do not move focus into the chart after each filter change. Coordinate the chart's
existing announcements with any selector status to avoid duplicate speech.
For asynchronous host data, retain the requested ID, expose loading/error state,
and reject stale responses before committing a view.

## Data adapter responsibilities

1. Resolve ADAPT `groupBy`, `filterBy`, axis fields, glossary labels/definitions,
   templates, and supplied option ordering into stable typed views.
2. Build All views by aggregation only when the data policy permits aggregation.
   The reference consolidates by category for All, but simply filters individual
   records for a selected option. Handle repeated categories deliberately; do
   not pass duplicate category IDs into the new chart.
3. Apply reference-compatible descending count order and label tie-breaking in
   the adapter when required. The chart preserves whatever order it receives.
4. Keep authoritative full-population and selected-population totals distinct.
   In screenshot 3, `102 / 510 = 20%` describes the population slice, while
   `102 / 102 = 100%` describes Home within the slice. Set chart total to 102;
   use 510 only for the authored population insight. A sum of disclosed values
   is not automatically the authoritative selected total under suppression.
5. Prepare safe selected-view context for chart, Data, and export. Never derive
   protected counts from differences between totals and disclosed categories.
6. Keep XLSX conversion at an optional export boundary. Export the selected view
   and its context/status consistently, without scraping the rendered table.

## Compatibility decisions that must remain explicit

**Suppression:** the grouped reference tests per-item suppression in one helper,
but its count/table paths largely test positive versus zero values under the
global flag. This is inconsistent source behavior, not a safe contract. The new
chart currently suppresses zeros globally and has no per-row count suppression
input. Before general replacement, add an explicit row-status contract that can
represent a true zero beside a suppressed row. Protected numbers must be absent
from public copied data, events, formatter calls, models, cards, tables, and
exports. Do not encode missing as suppressed or infer suppression policy from
the numeric value alone. Preserve the existing global mode intentionally if
needed, with documented precedence for explicit row status.

**Scale:** `$largestValue` in the grouped reference uses individual records from
the entire current section, even when All consolidates those records. This can
yield a different scale from the selected chart, and potentially ratios above
one for aggregated rows. The new chart's largest mode uses the supplied view
(including targets). Recommend an explicit optional shared scale maximum,
computed across valid prepared views, when comparisons across selections matter.
Keep percentage denominators independent of this scale. Do not carry over the
raw-record aggregation mismatch. Confirm the intended policy before claiming
scale parity; this changes quantitative interpretation, not only styling.

**Zero categories:** the old grouped bar list omits unsuppressed zeros while
keeping them in its table and no-data narrative. The new chart deliberately
retains zero rows. Recommend retaining this clearer distinction between zero
and absent data. Record it as an intentional difference in the swap review.

**Authored language:** supplied descriptions and Explain templates can contain
domain meaning beyond generated summaries. Preserve them via explicit content
inputs/adapter outputs; do not silently replace them with generic explanations.

**ARIA regressions:** retain the intent of the supplied tests: avoid redundant
wrapper descriptions, put expanded state on controls rather than definition
paragraphs, and resolve every controlled ID uniquely across instances. Test
rendered relationships rather than copying Angular-specific string assertions.

## Replacement acceptance fixtures

- Age and race/ethnicity selectors using the supplied labels; All and individual
  selections update chart, narrative, total, flags, table, and exports together.
- Screenshot 1 visible counts 365/80/20 with supplied total 510: preserve
  71.57%/15.69%/3.92%. Do not renormalize the visible sum of 465 to 100% or
  infer the meaning of the undisclosed remainder.
- Screenshot 2: total 510, Home 322 (63.14%), two suppressed categories.
- Screenshot 3: selected total 102, full population 510, Home 102 (100%), two
  suppressed categories, and both Filtered/Suppressed indicators. These fixtures
  reproduce screenshot facts; they are not a reconstruction of the full dataset.
- Multiple sections, explicit option order, real category named “all”, duplicate
  labels with distinct IDs, long labels, option definitions, and empty selections.
- True zero beside suppressed and missing rows; all-zero, all-suppressed,
  unknown denominator, explicit zero total, and invalid-data cases.
- Selection removal/reordering and locale updates preserve valid IDs and focus;
  external filtering survives All/reset; stale asynchronous results cannot win.
- Open Data dialog/inline view updates without closing or losing focus; exported
  CSV/XLSX and explanation agree with the active semantic model.
- Keyboard, pointer, touch, 320/375px reflow, 400% zoom, forced colors, and multiple
  instances. No document overflow, inaccessible option definitions, duplicate
  IDs, lost focus, or redundant change announcements.
- Real assistive-technology validation in the consuming Angular fixture before
  declaring the old components replaceable. Source inspection is insufficient.

## Implementation sequence

1. Implement the grouped-view companion and a runnable age/race fixture using
   prepared data, preserving the base chart API.
2. Add explicit row suppression and optional shared scale-domain support with
   semantic/export regression coverage; settle the policies above explicitly.
3. Add the ADAPT adapter, authored Explain support where required, and optional
   XLSX export. Verify real payloads and template outputs against the old system.
4. Exercise the acceptance fixtures in the actual consumer. Complete visual
   parity separately, then approve the production swap.

The sidebar is the largest visible missing interaction. Completing it alone
does not establish full functional parity.


## Implementation status — October 22, 2026

The local library and comprehensive gallery now include:

- `<a11y-bar-chart-group>` with native single-choice population controls, All
  views, multiple expandable sections, stable selection IDs, focus preservation,
  and one persistent chart.
- `prepareBarViewSection`, a pure preparation boundary for resolved population
  records, authoritative totals, ordered filters, safe aggregation, and authored
  content callbacks. Application-specific ADAPT glossary and template resolution
  remain in its consuming adapter.
- `valueSuppressed` per row with protected count redaction, explicit true zeros,
  and independent missing states.
- `scaleMaximum` for shared count scales and `inferTotal` for authoritative unknown
  totals. The user chose shared scales as the grouped default; demo customization
  also exposes rescaling and population-share modes.
- Authored `explanation`, selected-view context, and actual XLSX downloads, alongside
  CSV, using the canonical semantic model.
- Three gallery compositions: age, race/ethnicity, and multiple sections with
  availability states. Screenshot-derived values and illustrative additions are
  identified separately.

The initial inventory is retained as the rationale for these changes. This is
local library/demo implementation, not a production ADAPT replacement. Full
production payload mapping, original template output verification, and human
assistive-technology testing in the actual consumer remain integration work.
Visual matching remains deferred. See `GROUPED-PARITY-VERIFICATION.md` for local
verification evidence.
