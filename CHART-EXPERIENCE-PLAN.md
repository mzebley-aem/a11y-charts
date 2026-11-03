# A11y Line Chart experience plan

**Status:** Initial plan approved; Phase 1 complete locally; Phase 2 underway
**Created:** August 19, 2026
**Baseline:** Functional Angular parity committed at `7087d56`
**Scope:** One actual-versus-target line chart, built to be exceptionally usable across visual, keyboard, touch, screen-reader, magnified, high-contrast, speech, and refreshable-braille experiences

## Why this document exists

This is the living product and interaction plan for the chart experience. It
captures decisions, candidate ideas, research questions, success measures, and
implementation phases so valuable ideas are not lost or mistaken for approved
requirements.

The technical migration and release roadmap remains in `ROADMAP.md`. This plan
defines what the chart should feel like and what a user should be able to learn
from it.

## North star

> Within ten seconds, any user can understand the chart's overall story. Within
> one intentional interaction, they can retrieve an exact value and its
> meaning. No insight is available exclusively through sight, color, hover, or
> sound.

The product is not a canvas with accessibility attached. It is one coherent
data experience expressed appropriately through different media.

## Primary use case

The first and most important question is:

> Was the target met in the latest reported period?

“Latest reported period” means the latest ordered datum containing an actual
value. It does not mean the last row when later rows contain future targets
without actual results.

## Decisions already locked

| Decision | Direction |
|---|---|
| Primary question | Was the target met? |
| Primary period | Latest period containing an actual value |
| Visible summary | Present by default |
| Summary presentation | Integrated narrative beneath the title; bold primary answer followed by quieter supporting context, without a nested dashboard card |
| Summary customization | Structured labels and formatters plus a separate context note; the component retains canonical outcome and comparison language |
| Interaction order | Title/subtitle, narrative summary, chart explorer, display settings, then complete data view |
| Display settings | Separate native disclosure after the chart, collapsed by default and consumer-configurable to begin open |
| Complete data view | Consumer-configurable dialog or inline native disclosure; dialog is the default, with explicit existing hidden/screen-reader configuration retained |
| Initial point | Latest period containing an actual value is selected by default; consumers may override the initial explorer selection |
| Selection behavior | Hover previews; click/tap and keyboard commit; committed selection remains visible after details close |
| Point announcements | Concise, complete point narrative on navigation; keyboard instructions only on entry; do not repeat the full chart summary |
| Low-vision preferences | A small first-release set: value labels, shaded areas, patterns, vertical-scale mode, and a coordinated larger-details preset |
| Noteworthy-event shortcuts | Excluded from the first release; revisit only if research shows sequential navigation is inefficient |
| Historical context | Supporting information after the latest-period answer |
| Baseline support | One optional baseline period and value appears in the chart and every applicable summary |
| Baseline meaning | Reference point and earliest valid comparison boundary after a policy, methodology, or reporting change |
| Baseline value | Independently configured; it does not have to equal the baseline period's actual value |
| Baseline boundary | Must match the earliest displayed period for the first use case; pre-baseline data is not displayed |
| Baseline extent | Reference line continues through the full future-target horizon |
| Baseline explanation | Consumer may provide a short reason that appears in explanatory content while the primary summary remains concise |
| Interaction philosophy | Same insight across media; mechanics may differ by medium |
| Canonical point description | One interpretation model powers hover, keyboard, touch, screen-reader announcements, and table language |
| Period stepper | Show Previous/Next controls automatically when the chart overflows horizontally; consumers may configure `always` or `never` |
| Percentage comparison | Describe subtraction between percentage values as percentage points |
| Framework model | Direct Light DOM Web Component |
| Accessibility ambition | Exceed conformance-checklist thinking; optimize understanding, confidence, efficiency, and enjoyment |

## Latest-period outcome model

The primary outcome is determined only when the selected period contains the
values required for comparison.

| Data state | Primary language |
|---|---|
| Actual satisfies the configured positive direction | **Target met** |
| Actual equals target | **Target met — on target** |
| Actual does not satisfy the configured positive direction | **Target not met** |
| Actual exists but target is missing | **Target outcome cannot be determined** |
| No actual values exist | **No reported result yet** |

For the default `positiveDirection="above"`, equality or an actual value above
the target counts as met. For `positiveDirection="below"`, equality or an
actual value below the target counts as met.

Historical counts include only periods containing both an actual and target.
Future target-only periods do not count as failures.

## Default summary model

The visible summary should answer in this order:

1. Outcome and latest reported period.
2. Actual value, target value, and signed difference.
3. Historical count across comparable reported periods.
4. Missing-data or future-data condition when relevant.

The summary appears directly beneath the chart title/subtitle as integrated
narrative content. The outcome sentence receives the strongest typographic
emphasis. Historical and missing-data context follows with quieter hierarchy.
It is not placed in a nested card or presented as an alarm-style status panel.
An icon or color accent may reinforce the outcome, but text carries the full
meaning.

Example:

> **Target met in 2020.** Actual performance was 83.92%, compared with a target
> of 77.02%—6.90 percentage points above target. The target was met in 1 of 5
> reported years. No actual data has been reported after 2020.

The summary must be accurate for `positiveDirection="below"`, equality,
missing targets, no actuals, one point, all-complete data, and generic numeric
values.

### Consumer content contract

Consumers control the chart title and subtitle. They may also configure:

- actual, target, and baseline series names;
- period formatting;
- number and unit formatting;
- the positive direction used to evaluate target outcome;
- a short baseline explanation; and
- an optional plain-language context note presented separately after the
  canonical generated summary.

The component owns the core outcome, comparison, missing-data, baseline-change,
and historical-count sentences. The first release does not permit free-form
summary templates, HTML injection, or a separate screen-reader-only summary
override. Structured labels and formatter results are applied consistently to
the visible summary, point details, announcements, data view, and semantic
events, with safe fallback behavior for invalid values.

Localization uses a complete English message catalog with consumer-supplied
key/value overrides for visible and assistive text. Generated sentences use
whole templates, named placeholders, and locale-aware plural variants. Missing
overrides fall back to English. Numeric locale configuration is separate.
The October 19 bar-chart and shared-capability contract is recorded in
[`BAR-CHART-SPEC.md`](./BAR-CHART-SPEC.md).

## Baseline-period requirement

The first use case requires one optional baseline period and value. The
baseline represents the point at which a policy, methodology, reporting
strategy, or other material condition changed. It is therefore both:

1. a reference value for describing progress; and
2. the earliest period from which comparisons are considered valid.

The baseline does not determine whether the target was met. Target outcome
continues to compare actual against target for the latest reported period. The
baseline adds a separate “change from baseline” interpretation.

### Required baseline communication

- Identify the baseline period and value in the visible summary.
- Attach the baseline period, value, and explanation to the interactive chart's
  accessible description so assistive technology announces it on entry.
- Do not repeat baseline values or change-from-baseline content in point cards
  or point-by-point announcements.
- Identify the baseline in the chart without presenting it as a repeated annual
  measurement.
- Include baseline meaning in the chart's explanatory content.
- Include the baseline in data-fit Y-axis calculations.
- Do not compare or count data before the baseline unless an explicit future
  product decision defines a contextual pre-baseline presentation.
- Describe differences between percentage values in percentage points.
- Treat a missing or invalid baseline as unavailable context, never as target
  failure.

### Recommended visual direction

Treat the baseline as a subdued reference layer behind actual and target:

- begin the reference at the baseline period;
- use one distinctive marker at the baseline period/value;
- extend a thin, non-solid horizontal reference line through the comparable
  period;
- do not repeat point symbols at every subsequent year, because that implies
  new baseline observations;
- directly label the line with period and value where space permits, while also
  providing a clear legend treatment;
- achieve lower visual hierarchy through weight, layering, and stroke style—not
  through insufficient contrast;
- do not use a background band unless the data semantics genuinely define a
  range, tolerance, or threshold area.

The Figma direction is therefore retained, with the repeated baseline markers
removed. A muted background reference line is preferred over making baseline a
third peer series. These baseline decisions are approved for the first use
case.

### Baseline summary example

> **Target met in 2020.** Actual performance was 83.92%, compared with a target
> of 77.02%—6.90 percentage points above target. Performance was 45.92
> percentage points above the 2015 baseline of 38%. The target was met in 1 of
> 5 reported years. No actual data has been reported after 2020.

The chart-level accessible description should use an unambiguous label such as
“Baseline: 2015, 38%.” Point details do not repeat the baseline or change from
baseline.

## Experience architecture

### 1. Understand the story

- Visible plain-language summary before detailed exploration.
- Immediate answer to the primary question.
- Trend, turning-point, historical, and missing-data context only when they add
  meaning.
- No requirement to understand charting conventions before understanding the
  outcome.

### 2. Explore precisely

- Pointer, keyboard, touch, and assistive technology share one selected point.
- Selected state is persistent and visible rather than hover-only.
- Every point description includes period, position, actual, target,
  target difference, baseline difference, outcome, and missing-data meaning as
  applicable.
- Internal scrolling keeps the selected point and its details visible without
  moving the document.
- The current one-tab-stop Arrow/Home/End model remains the starting point and
  must be validated with users before additional shortcuts are adopted.
- The latest reported actual period is the default initial selection. It is
  visually emphasized on render and becomes the keyboard navigator's initial
  value, while its floating tooltip remains closed until interaction.
- The primary summary always describes the latest reported period, even when a
  consumer configures the explorer to begin on a different point.

### Developer-configured initial selection

The public API should use a stable strategy or x-axis value rather than a
fragile array index. Proposed shape:

```ts
type A11yLineChartInitialSelection =
  | { mode: 'latest-actual' }
  | { mode: 'first' }
  | { mode: 'last' }
  | { mode: 'none' }
  | { mode: 'x'; value: string | number | Date };
```

- `latest-actual` is the default.
- `first` selects the earliest displayed period.
- `last` may select a future target-only period.
- `none` renders without a persistent initial selection; keyboard focus still
  begins from the latest actual period so the navigator has a meaningful value.
- `x` selects an exact matching period.
- An invalid exact value falls back to `latest-actual` and emits a
  component-level configuration error without leaving the chart unusable.
- User interaction supersedes the initial setting.
- When data is replaced, preserve the selected x value when it still exists;
  otherwise apply the configured fallback strategy.

### 3. Investigate deeply

- Complete structured data view using the same formatting and outcome model.
- Optional labels, fills, patterns, axis titles, and magnitude-aware data-fit
  zoom that remains useful for tightly grouped fractional values.
- Display preferences remain available without blocking access to the chart.
- Potential future navigation to noteworthy events such as first target met,
  largest gap, or first missing result.

## Candidate experience improvements

These ideas are captured but are not all approved for implementation.

### Information hierarchy

- Place title, visible summary, and chart exploration before secondary display
  settings.
- Make the chart explorer the first interactive chart-specific stop.
- Move display controls after the chart or into a clearly named native
  disclosure so they are available without becoming a keyboard toll booth.
- Keep status language visible and textual; color and iconography may reinforce
  it but never replace it.
- Present baseline as supporting context after the target outcome, not as a
  competing primary status.
- Make the chart explorer the first chart-specific interactive stop.
- Place a native **Chart display settings** disclosure after the chart. Keep it
  collapsed by default, describe the available adjustments, and allow consumers
  to configure it to begin open.
- Place a separate **View chart data** action after display settings. Open the
  configured dialog by default, or a native disclosure in inline mode.
  Changing presentation and reading source values are different intentions and
  should not be combined into one control group.

### Keyboard experience

- Preserve Left/Right, Home/End, wraparound, visible focus, and scroll sync.
- Explore a persistent selected-point indicator and pinned details.
- Do not add Page Up/Page Down or other noteworthy-event shortcuts in the first
  release. With eleven periods, latest-actual default selection, Home, End, and
  sequential arrows provide direct access without another hidden key model.
- Reconsider event shortcuts only if task-based testing shows that locating
  turning points, largest changes, or target-status changes is inefficient.
- Explore Escape for dismissing pinned details without removing the selection.
- Never capture keys without clear instructions and a reliable exit.

### Shared selection behavior

- Initial render commits the configured initial point visually without opening
  a floating tooltip.
- Hover temporarily previews a point and its canonical narrative. Pointer exit
  restores the committed selection.
- Click or tap commits a point and pins its tooltip.
- Arrow/Home/End navigation commits each new point and shows its tooltip.
- When focus leaves the chart, the floating tooltip closes while the committed
  point remains visually selected.
- Escape closes a pinned tooltip without discarding the committed selection.
- A preview never silently replaces the user's committed point.

### Screen-reader and refreshable-braille experience

- Introduce the chart progressively: name, concise summary, interaction model,
  current point, and complete data.
- Avoid repeating long instructions on every focus entry.
- Ensure chart exploration and table reading are complementary paths, not a
  “real chart” and a lesser fallback.
- Validate the range-control model with VoiceOver, NVDA, JAWS, TalkBack, and
  refreshable braille before declaring it stable.

### Point announcement cadence

- On first focus, announce short keyboard instructions followed by the current
  point's complete narrative.
- On Arrow, Home, or End navigation, announce only the newly selected point.
- Include period, position in the series, target outcome, actual, target, and
  difference from target when those values exist. Announce baseline context
  once when entering the interactive chart, not on each point.
- State missing actual or target values explicitly and never imply failure when
  an outcome cannot be determined.
- Do not repeat the full chart summary during point-by-point exploration.
- Do not add a user-facing verbosity setting unless testing demonstrates a
  specific need for one.
- Avoid simultaneous range-control and live-region speech when assistive-
  technology testing shows that it creates duplicate announcements.
- Exclude computed trend narration from the default point announcement until
  user research demonstrates that it improves understanding without increasing
  cognitive load.

Example for a comparable reported period:

> 2020, 6 of 11. Target met. Actual 83.92%. Target 77.02%. 6.90 percentage
> points above target.

Example for a future target-only period:

> 2023, 9 of 11. No actual value has been reported. Target 80.77%. Target
> outcome unavailable.

### Low-vision experience

- Support browser zoom through 400% without document-level overflow.
- Keep details in scalable HTML rather than canvas-only text.
- Maintain a persistent selected point, crosshair, and contrast-safe focus.
- Preserve non-color distinctions through stroke style, point shape, outline,
  and optional patterns.
- Define intentional forced-colors behavior rather than relying on canvas
  preservation.

The first internal release provides a deliberately small set of user-facing
display preferences:

- **Show value labels**;
- **Show shaded areas**;
- **Differentiate areas with patterns**;
- **Vertical scale:** full range or focused data range; and
- **Larger chart details**, a coordinated preset that increases line, marker,
  label, and focus-indicator size together.

These preferences change presentation, not meaning. The visible summary,
point narrative, data view, and emitted semantic result remain consistent when
a preference changes.

The following behaviors are automatic rather than settings users must discover:

- usable reflow and chart exploration at 400% browser zoom;
- intentional forced-colors rendering;
- contrast-safe focus and selected states; and
- non-color differentiation for actual, target, and baseline.

Actual, target, and baseline remain visible in the first use case because all
three are necessary to answer the chart's defined questions. Consumers may
configure granular presentation details such as individual line widths, marker
sizes, label sizes, axis-title presentation, and the initial open state of the
settings disclosure. Those developer options must not weaken required focus,
contrast, touch-target, semantic, or data-meaning guarantees.

### Touch and small-screen experience

- Use the same selected-point model as pointer and keyboard interaction.
- Provide touch targets that do not require precise contact with a plotted
  point.
- Provide a Previous/current-period/Next stepper when the chart overflows
  horizontally. Each button selects through the canonical navigation path,
  scrolls the period into view, opens its details, announces the point, and
  emits the same point-change event as keyboard navigation.
- Use `stepperVisibility: 'auto' | 'always' | 'never'`, with `auto` as the
  default. Disable endpoint buttons unless wraparound is enabled, preserve a
  minimum 44 by 44 CSS-pixel target, and expose contextual adjacent-period
  button names.
- Keep intentional horizontal chart scrolling contained and understandable.
- Preserve tooltip/details visibility while navigating near viewport edges.
- Treat intermediate widths as larger mobile until the desktop composition can
  fit without compromise.

### Data view

- Offer a visible way to reveal the complete data table.
- Consider adding an outcome column using the same semantic evaluator.
- Present baseline period/value as table metadata and consider a
  change-from-baseline column; do not repeat a constant baseline-value column
  without a demonstrated user need.
- Preserve the currently selected period when switching between chart and data
  views.
- Avoid unnecessary table interactivity unless it improves a defined task.

### Trust and consistency

- Centralize outcome evaluation, value formatting, differences, and narrative
  generation in pure tested functions.
- Use the same result for summary, tooltip, `aria-valuetext`, live region,
  table, events, and future exports.
- Distinguish percentages, percentage points, currency, counts, and custom
  numeric units correctly.
- Never infer a target failure from missing or future actual data.

## Ideas intentionally parked for later evaluation

- Sonification or optional audio exploration.
- Print-optimized narrative and data presentation.
- Structured export that retains outcome descriptions.
- Tactile/embossing-friendly output research.
- Persisted user display preferences.
- No-JavaScript progressive enhancement.
- Noteworthy-event keyboard shortcuts for longer or demonstrably difficult data
  series.
- Additional chart types. The product remains focused on this one chart.

## Success measures

Conformance is a release floor, not the complete measure of success. The chart
should be evaluated through representative tasks:

1. Determine whether the latest reported target was met.
2. Identify the latest actual and target values.
3. State the difference using the correct unit.
4. Determine how often the target was met historically.
5. Identify the baseline and determine change from baseline.
6. Identify missing or future actual data without interpreting it as failure.
7. Locate an exact earlier period and understand its outcome.
8. Recover orientation after zooming, scrolling, changing a display setting, or
   returning to the chart.

For each input/reading medium, measure:

- task completion and correctness;
- time to first correct answer;
- navigation effort and unnecessary keystrokes;
- recovery from mistakes or lost orientation;
- perceived confidence and cognitive effort;
- consistency of answers across visual, spoken, and braille representations;
- subjective satisfaction and preference.

The aspirational benchmark is that the primary question can be answered
correctly within ten seconds and exact point meaning is available within one
intentional interaction.

## Required research and validation

### Compliance profile

- **Product target:** [WCAG 2.2 Level AA](https://www.w3.org/TR/WCAG22/) as the
  current accessibility release floor.
- **Federal overlay:** evaluate applicable integrations against the
  [Revised Section 508 Standards](https://www.access-board.gov/ict/), which
  incorporate WCAG 2.0 Level A and AA and include requirements beyond Web
  content where applicable. Passing the WCAG 2.2 target and passing a Section
  508 review are recorded as related but separate facts.
- **Beyond conformance:** applicable AAA criteria and emerging best practices
  remain aspirational improvements unless explicitly adopted as release
  requirements.
- **Claim boundary:** WCAG conformance applies to complete pages, not an
  isolated component. Audit claims therefore apply only to named demo or
  consumer-fixture pages and their tested states. Package documentation states
  what the component supports and what remains the consumer's responsibility.

### Evidence ladder

#### 1. Continuous development evidence

- Run unit and integration matrices for outcome, missing-data, baseline,
  formatting, narrative, selection, settings, and public-event behavior.
- Run automated accessibility checks as leads, then manually confirm relevant
  rendered behavior and eliminate false positives.
- Exercise keyboard, pointer, and touch paths; reverse focus order; focus
  restoration; accessible name, role, value, and state; and live
  announcements.
- Verify zoom/reflow through 400%, forced colors, reduced motion, text scaling,
  selected-state contrast, and intentional chart-region scrolling.
- Verify representative states at 320, 375, 390, 480, 640, 768, 1024, 1280,
  and 1440 CSS pixels, with additional widths when a defect appears between
  breakpoints.
- Record the tested browser, operating-system, device, and assistive-technology
  versions with each result.

This stage supports implementation progress. Participant recruitment does not
block coding.

#### 2. First internal-use release gate

- Complete a WCAG 2.2 Level AA audit and a separately reported Section 508
  review of the named internal consumer fixture and every chart state in scope.
- Complete hands-on testing with VoiceOver and NVDA at minimum; simulation or
  source inspection does not substitute for actual assistive-technology use.
- Conduct moderated task sessions with at least one blind screen-reader user
  and at least one low-vision or magnification user.
- Require the eight representative tasks in this plan to be achievable and
  correct. A defect that prevents a task, communicates a wrong result, traps or
  loses the user, or fails the configured compliance floor blocks release.
- Record lesser limitations explicitly with owners and retest criteria rather
  than treating a clean automated scan as sufficient evidence.

#### 3. Public-release and accessibility-claim gate

- Test the documented support matrix with NVDA, JAWS, VoiceOver on macOS and
  iOS, TalkBack on Android, and refreshable braille where available.
- Run a broader task-based usability round across blind, low-vision,
  keyboard/motor, and mobile screen-reader experiences, allowing participants
  to overlap across those groups.
- Repeat the WCAG 2.2 Level AA and applicable Section 508 audits on the exact
  versioned demo and framework-consumer fixtures being released.
- Complete framework fixtures, public documentation, examples, packaging,
  license, contribution guidance, and a dated support-and-limitations record.
- Make only claims supported by the named pages, states, versions, methods, and
  results in the evidence package.

## Approved delivery sequence

### Phase 1 — Semantic foundation and visible answer

- Build a pure latest-reported-period evaluator.
- Build a baseline-aware, unit-aware difference and narrative model.
- Render the visible default summary.
- Route summary, tooltip, keyboard announcement, table outcome, and public event
  data through the shared semantic model.
- Add complete outcome/missing-data test matrices.
- Add baseline validation, rendering-option, narrative, and boundary test
  matrices.

#### Approved Phase 1 definition of done

- A pure, ECharts-independent semantic model determines latest actual, target
  outcome, differences, historical counts, baseline change, and missing-data
  states.
- A typed, validated baseline and structured summary-configuration API is
  available to direct consumers.
- The integrated latest-period summary renders before chart exploration.
- The muted baseline reference line, single marker, direct label, legend
  treatment, and Y-axis inclusion are implemented.
- Summary, tooltip, keyboard narrative, table outcome, and point-change event
  consume the same semantic result.
- The demo contains the complete eleven-period use case, including future
  targets and a baseline.
- Tests cover both positive directions, equality, missing values, future-only
  targets, invalid baselines, percentage-point language, generic units, and
  consumer formatting.
- Tests, typecheck, package build, demo build, accessibility smoke checks, and
  desktop/mobile browser verification pass.
- Package and repository documentation describe the public contract.

Persistent selection, disclosure restructuring, deeper assistive-technology
tuning, and low-vision presets remain in their later phases.

### Phase 2 — Interaction hierarchy and persistent selection

- Put the summary and chart exploration before secondary settings.
- Make selection persistent across pointer, keyboard, and touch.
- Refine selected-point visuals, focus, details positioning, and scroll sync.
- Provide overflow-aware Previous/Next period controls through the shared
  selection model, with consumer-configurable always/never overrides.
- Evaluate the display-settings disclosure and visible data-table control.

### Phase 3 — Screen-reader and braille refinement

- Conduct the range-control research spike across required assistive
  technologies.
- Tune names, descriptions, announcement length, instruction timing, and
  repeated-navigation behavior.
- Prototype alternatives only when testing identifies a specific failure.

### Phase 4 — Low-vision and responsive refinement

- Add scalable display preferences that testing proves useful.
- Harden forced colors, zoom, magnification, tooltip scaling, and selected-state
  contrast.
- Validate responsive behavior and touch exploration at the complete viewport
  matrix.

### Phase 5 — Deep exploration and delight

- Evaluate noteworthy-event navigation.
- Refine the visible data view and cross-view selection.
- Add restrained feedback and motion only where it clarifies continuity.
- Revisit parked ideas according to user evidence and product value.

### Phase 6 — Release evidence

- Complete the internal and public evidence gates defined above.
- Add framework consumer fixtures, public documentation, examples, packaging,
  license, contribution guidance, and honest support claims.

## Remaining planning decisions

None block Phase 1 implementation. Later-phase research decisions remain
evidence-driven as described above.

## Planning completion gate

Satisfied August 19, 2026:

1. the locked decisions and primary summary model were approved;
2. candidate ideas were triaged into now or later;
3. the product decisions required for Phase 1 were resolved;
4. success measures and required validation were accepted; and
5. the first implementation phase received an agreed definition of done.
