# A11y Line Chart product and migration roadmap

The living product and interaction plan is maintained in
[`CHART-EXPERIENCE-PLAN.md`](./CHART-EXPERIENCE-PLAN.md). This roadmap covers
architecture, migration, compatibility, and release sequencing; the experience
plan defines the intended user understanding and interaction quality.

**Status:** Implementation underway on `codex/vanilla-web-component-migration`
**Updated:** August 19, 2026
**Starting point:** Angular 18 proof of concept at `8c75e34`, plus the current uncommitted pattern-control experiment
**First audience:** Internal consumers with one specific actual-versus-target use case
**Long-term audience:** Public, open-source consumers using any framework or no framework

## Implementation checkpoint: August 19, 2026

The framework-neutral package now exists in `packages/line-chart` alongside the
untouched Angular reference. Functional parity has been restored as the new
starting baseline, including:

- a Light DOM-only autonomous custom element with idempotent registration;
- validated replaceable data, config, theme, and value-formatting properties;
- unique instance relationships, safe lifecycle cleanup, empty/error states,
  and an accessible data table;
- an internal ECharts 6 adapter with the original layered area/outline/main
  rendering, missing values, labels, axes, base/data-fit bounds, outcome
  tooltips, legend synchronization, resizing, and reduced motion;
- series differentiation by color, solid/dashed line, and circle/diamond point;
- all original display controls, pattern choices, theme tokens, dynamic sizing,
  announcements, tooltip customization, and Angular-shaped data/config
  compatibility;
- one valid native range-control tab stop for Arrow/Home/End navigation,
  wraparound, live point descriptions, visible focus, and automatic internal
  scrolling to offscreen points;
- overflow-aware Previous/Next period controls with 44 px touch targets,
  contextual adjacent-period names, endpoint and wraparound behavior, and the
  same selection, tooltip, announcement, scrolling, and event path;
- a framework-free two-chart HTML consumer fixture matching the Angular
  datasets, with desktop and 375 px rendered proof;
- passing TypeScript, behavior-test, and production-build gates on Node 24.16.

Still required before an accessibility-ready public release: physical
assistive-technology testing, all-framework consumer fixtures, the historical
browser matrix, packaging metadata, and publication/licensing work. Those are
release-readiness gates rather than missing chart features.

The approved product-experience Phase 1 is now implemented locally on top of
that parity baseline:

- one pure ECharts-independent semantic model determines the latest reported
  period, target outcome, target difference, historical counts, missing/future
  states, and baseline change;
- a typed and validated independent baseline property requires the earliest
  displayed period while allowing a value different from that period's actual;
- the visible integrated summary, default tooltip, keyboard narrative, data
  table, and point-change event consume the same interpretation;
- the baseline renders as one labeled starting marker plus a subdued reference
  line across the complete horizon and participates in data-fit Y bounds;
- structured consumer labels, period/value/difference formatters, baseline
  explanation, and context note retain canonical fallback language; and
- the framework-free demo exercises eleven periods, future targets, two
  baseline configurations, desktop rendering, and contained 375 px scrolling;
  and
- 35 behavior tests, typecheck, package build, demo build, production dependency
  audit, and rendered desktop/mobile smoke checks pass locally.

## Product direction

Build one actual-versus-target line chart exceptionally well as an autonomous custom element:

```html
<a11y-line-chart></a11y-line-chart>
```

The production component will:

- use TypeScript and browser-standard Custom Elements;
- have no Angular, React, Vue, Svelte, or other UI-framework runtime;
- render exclusively in the Light DOM and never call `attachShadow()`;
- retain ECharts as an internal rendering dependency for the first version;
- keep ECharts objects and event names out of the public API;
- be consumed directly without framework wrappers;
- retain every current chart feature while correcting the audited defects;
- use WCAG 2.2 Level AA as the product floor and report applicable Section 508
  review separately;
- treat useful AAA improvements as enhancements rather than mislabeled blockers;
- support generic numeric values and formatter hooks, with percentage behavior provided as the primary preset;
- target the current and previous 10 major stable versions of the named browsers;
- defer no-JavaScript progressive enhancement until after the first internal release, without designing the first API into a corner.

The [HTML Standard](https://html.spec.whatwg.org/multipage/custom-elements.html) defines autonomous custom elements as ordinary elements whose behavior is supplied by an author-defined `HTMLElement` class. This is the interoperability boundary for the project—not a framework adapter.

## Decisions now locked

| Decision | Direction |
|---|---|
| Product shape | One excellent actual-versus-target line chart |
| Initial release | Internal, use-case-specific |
| Long-term release | Public and open source |
| Framework strategy | Standards-based custom element; no framework runtime |
| Rendering engine | ECharts 6 internally for v1; replaceable behind an adapter |
| DOM model | Light DOM only |
| Accessibility floor | WCAG 2.2 AA product target; applicable Section 508 overlay reported separately |
| Public consumption | Direct Custom Element use; no wrappers |
| Data semantics | Generic numeric values + formatter hooks; percentage preset |
| Configuration | Properties for complex data; attributes for simple values; standard `CustomEvent`s |
| Styling | CSS custom properties plus strictly prefixed Light DOM selectors |
| Current features | Preserve all |
| Browser target | Current and previous 10 major stable releases |
| Distribution | Deferred; npm or GitHub Packages later |
| License | MIT planned for the open-source phase |
| Progressive enhancement | Explicitly deferred, with a future-compatible DOM contract |

## Light DOM consequences

Light DOM is a deliberate product requirement, not an implementation shortcut. It gives consumers, testing tools, and assistive technology direct access to the rendered HTML. It also removes Shadow DOM style encapsulation, so the component must supply its own disciplined boundary.

### Required rules

- All generated classes use the `a11y-line-chart__*` namespace.
- All distributed CSS selectors begin with `a11y-line-chart` or a documented component-state selector.
- No generic selectors such as `.controls`, `.sr-only`, `table`, `label`, or `:root` may ship unscoped.
- Theme defaults live on `a11y-line-chart`; consumers override documented custom properties on an instance or ancestor.
- The package ships a standalone CSS artifact. Every integration fixture must prove the documented import/link path.
- Consumer CSS access is possible because this is Light DOM, but internal class names are not a versioned customization API unless explicitly documented.
- The implementation owns only nodes marked with a private generated ownership attribute. It must not indiscriminately replace all authored children.
- Disconnecting and reconnecting an element must clean up and restore observers, events, timers, and the ECharts instance without duplicating DOM.
- Multiple instances must have unique IDs and must never query or mutate another instance's descendants.

### No native slots

The earlier API recommendation included slots, but native `<slot>` projection is a Shadow DOM feature. The [Web Components documentation](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_templates_and_slots) describes slots as placeholders populated into a shadow tree. Because this project is Light DOM only, native slots are removed from the contract.

Where authored content is valuable, use one of these Light DOM-safe conventions instead:

- simple text attributes/properties for title, subtitle, and axis labels;
- documented child elements or `data-*` hooks for future declarative content;
- a future fallback table/content convention that can exist before upgrade and be adopted rather than destroyed.

## Version-one feature contract

Every current feature remains in scope. Migration may improve the mechanism, but not silently remove the outcome.

### Data and display

- Actual and target values across an ordered x-axis.
- Missing and future actual values represented as gaps.
- Actual and target line visibility.
- Actual and target value-label visibility.
- Actual and target area-fill visibility.
- Actual and target patterns: none, diagonal, dots, and horizontal.
- Visual and nonvisual tooltip modes.
- X- and Y-axis titles.
- Default/base Y-axis range plus data-fit zoom.
- Outcome semantics: above, below, or equal; configurable positive direction and labels.
- Multiple independent instances.
- Intrinsic width, responsive containment, and horizontal chart scrolling where necessary.
- Reduced-motion handling.
- Theme tokens for colors, fills, patterns, widths, symbols, labels, focus, and axes.

### Required states

The component must define and test:

- not yet configured;
- loading data;
- valid data;
- empty data;
- partially missing data;
- invalid data/configuration;
- one data point;
- many data points;
- all series hidden;
- non-overflowing and overflowing layouts;
- default, hover, keyboard focus, active point, disabled/unavailable option, and forced-color states;
- connected, disconnected, and reconnected lifecycle;
- data/config/theme replaced after first render.

Empty and error states must explain what is absent or invalid and identify the corrective action. They may not leave an empty 400 px canvas-shaped hole.

## Draft public API

The first implementation should validate this contract in plain HTML and all framework fixtures before declaring it stable.

### Registration

Provide both entry points:

```ts
import '@a11y-charts/line-chart/define'; // idempotently registers a11y-line-chart
```

```ts
import { A11yLineChartElement, defineA11yLineChart } from '@a11y-charts/line-chart';

defineA11yLineChart(); // safe to call more than once
```

The final package name is intentionally provisional. `customElements.define()` must never run twice for the same class/name.

### Complex properties

```ts
type A11yLineChartDatum = {
  x: string | number | Date;
  actual: number | null;
  target: number | null;
};

type A11yLineChartFormatContext = {
  value: number | null;
  series: 'actual' | 'target';
  x: string | number | Date;
  locale: string;
};

interface A11yLineChartElement extends HTMLElement {
  data: A11yLineChartDatum[];
  config: A11yLineChartConfig;
  theme: A11yLineChartTheme;
  formatValue?: (context: A11yLineChartFormatContext) => string;
  formatAxisValue?: (value: number, locale: string) => string;
  formatXValue?: (value: A11yLineChartDatum['x'], locale: string) => string;
  renderTooltip?: (container: HTMLElement, context: A11yLineChartTooltipContext) => void;
  formatTooltipAnnouncement?: (context: A11yLineChartTooltipContext) => string;
}
```

Properties accept real objects/functions. The component must snapshot or validate mutable inputs predictably and rerender when a property is replaced.

### Simple attributes

Initial candidates:

- `chart-title`
- `subtitle`
- `x-axis-title`
- `y-axis-title`
- `locale`
- `value-preset="percent|number"`
- `heading-level="1|2|3|4|5|6"`
- `positive-direction="above|below"`
- boolean attributes for table, wrapping, visible series/fills/labels, axis titles, tooltip, and initial Y zoom

Every reflected boolean follows normal HTML semantics: presence means true; absence means false. Avoid string values such as `attribute="false"`.

Complex `data`, `config`, and `theme` JSON attributes are out of the first stable contract. They can be considered with the future declarative/progressive-enhancement design.

### Events

Dispatch framework-neutral `CustomEvent`s with documented, versioned detail objects:

- `a11y-line-chart-point-change`
- `a11y-line-chart-display-change`
- `a11y-line-chart-ready`
- `a11y-line-chart-error`

Events bubble. They describe component-level meaning, not ECharts series indexes or action names. No internal rendering object is exposed.

### Tooltip customization safety

Retain customizable visual and ARIA tooltips, but do not preserve raw string interpolation as the public mechanism.

- Default tooltips are constructed with DOM APIs and `textContent`.
- `renderTooltip(container, context)` may populate a provided element.
- `formatTooltipAnnouncement(context)` returns plain text.
- No untrusted label, data value, or callback result is assigned through `innerHTML` by the library.
- An explicitly unsafe HTML escape hatch is not part of v1.

This preserves customization while removing the current string-based injection surface.

## Accessibility architecture

Accessibility is the component's primary functional contract.

### Semantic structure

- A named `figure` or equivalent chart region tied to the visible title.
- One specific accessible name per chart; never the generic “Performance chart.”
- A real HTML table containing the same data and formatting as the visual chart.
- Table IDs and every help/description ID generated uniquely per instance.
- User instructions adjacent to the interaction surface and connected programmatically.
- Native checkbox/select/button controls for display options.
- A valid name, role, and current value for point navigation.
- Status messages are polite by default and never cleared by an older timer after a newer message.

### Point-navigation spike

Before porting the existing generic focus overlay, prototype and screen-reader test two valid models:

1. a native range control representing the selected point with an informative `aria-valuetext`; and
2. a discrete point-selection pattern with an appropriate composite role.

Choose the model that produces the clearest VoiceOver, NVDA, JAWS, and TalkBack experience while keeping the selected point and tooltip visibly synchronized. Do not use `aria-roledescription` to compensate for a missing role.

### Visual requirements

- Default actual and target encodings meet 3:1 against every adjacent color.
- Color is never the only distinction between series or outcome.
- Patterns are optional preferences, but the default presentation is independently compliant.
- One consistent 3 px, 2 px-offset focus treatment survives the page, fill, tooltip, and forced-color surfaces.
- At 320 px and the 400% equivalent, there is no body-level overflow. Intentional chart overflow remains contained, named, and keyboard operable.
- Selecting a point scrolls only the internal chart viewport enough to keep that point and tooltip visible.
- Animations respect `prefers-reduced-motion` with no information loss.
- Controls meet WCAG 2.2 AA target size/spacing and aim for a 44 px active row.

### Assistive-technology release matrix

Required before the internal v1 is called accessibility-ready:

- VoiceOver + Safari on macOS.
- NVDA + Chrome on Windows.
- JAWS + Chrome or Edge on Windows when available internally.
- VoiceOver + Safari on iOS.
- TalkBack + Chrome on Android.

Test discovery, title/description, data table, point navigation, visible synchronization, option changes, missing data, errors, multiple instances, and reconnect behavior.

## Browser support policy

### Support target

Support the current and previous 10 **major stable releases** of:

- Chrome desktop;
- Edge desktop;
- Firefox desktop;
- Safari desktop;
- Safari on iOS;
- Chrome on Android.

“Previous 10” means major release lines, not 10 point/security releases. The supported-version manifest is regenerated for each release candidate so “current” has a dated meaning.

### Honest verification model

One test layer cannot cover this promise:

1. **Every change:** unit tests plus current Chromium, Firefox, and WebKit engine tests.
2. **Pull-request gate:** current, current-1, and current-2 available desktop engines; current iOS/Android smoke where infrastructure permits.
3. **Release-candidate grid:** every supported major version available through a hosted cross-browser provider or maintained device/VM lab.
4. **Physical assistive-technology matrix:** current supported OS/browser combinations listed above.

The internal release may be labelled provisional for versions unavailable in the lab, but it may not claim “tested current + 10” until that grid exists and passes. Safari/iOS coverage must use actual versioned Safari environments rather than treating current Playwright WebKit as proof for historical Safari.

### Compatibility engineering rules

- Generate an explicit version manifest; do not rely on an undocumented “modern browsers” phrase.
- Derive the JavaScript/CSS build target from the oldest browsers in that manifest.
- Prefer established platform APIs available across the matrix.
- Avoid making newer conveniences such as scoped registries, customized built-ins, or new CSS selectors part of the core implementation unless transpiled or feature-gated.
- Feature-detect optional capabilities.
- Do not ship a global polyfill bundle. Document any consumer-required polyfill only if the matrix proves one is necessary.
- Run the plain-HTML fixture without any framework or development server transformation.

## Technical architecture

### Proposed repository shape

```text
packages/
  line-chart/
    src/
      a11y-line-chart-element.ts
      define.ts
      model.ts
      config.ts
      state.ts
      format.ts
      accessibility.ts
      chart-options.ts
      echarts-adapter.ts
      styles.css
    test/
      unit/
      component/
      accessibility/
fixtures/
  plain-html/
  angular/
  react/
  svelte/
  vue/
legacy/
  angular-reference/          # retained until parity sign-off
```

The exact workspace tooling can change during scaffolding, but the package boundary may not depend on fixture frameworks.

### Tooling direction

- Node 24 LTS for repeatable local/CI builds; Node 24 is currently listed as LTS by the [Node.js project](https://nodejs.org/en/about/previous-releases).
- TypeScript with strict mode.
- A small framework-free library build, producing ESM, declarations, source maps, and CSS.
- Vitest or an equivalent fast unit runner for pure logic and DOM behavior.
- Playwright for current-engine browser behavior, responsive, keyboard, and visual regression tests.
- axe-core as an automated lead generator, with confirmed manual findings and assistive-technology gates.
- A hosted historical-browser provider added before the current-plus-10 claim.
- No Karma, Angular CLI, Zone.js, or framework compiler in the production package.

### Rendering boundary

`A11yLineChartElement` owns lifecycle and public API. Pure modules own validation, formatting, theme resolution, outcome evaluation, and state transitions. `EchartsAdapter` owns all ECharts-specific option/action/event translation.

This boundary lets a future rendering engine replace ECharts without changing consumers, data contracts, events, accessible HTML, or tests.

## Migration phases

### Phase 0 - Preserve the reference and lock contracts

**Deliverables**

- Keep the current Angular proof of concept runnable as the parity reference.
- Preserve the current uncommitted pattern controls as in-scope behavior.
- Record representative screenshots, DOM/accessibility snapshots, data, configuration, and known defects.
- Turn the audit's expected good behavior into framework-neutral acceptance tests.
- Mark audited failures as requirements to correct, not behaviors to clone.

**Exit gate**

- Every current feature is mapped to a test or an explicitly deferred item.
- Existing source work remains recoverable and distinguishable from migration changes.

### Phase 1 - Create the framework-free foundation

**Deliverables**

- Add the parallel `packages/line-chart` package.
- Pin Node/tooling for the new package without breaking the Angular reference.
- Implement idempotent registration, Light DOM lifecycle, prefixed styles, unique instance IDs, validation, and empty/error states.
- Add plain-HTML fixture and current-engine CI.
- Establish build artifacts with no Angular runtime.

**Exit gate**

- `<a11y-line-chart>` registers, connects, disconnects, and reconnects cleanly.
- Two instances coexist with zero duplicate IDs or shared state.
- No generated selector escapes the component namespace.
- A production build, unit tests, and current-engine smoke tests pass.

### Phase 2 - Port rendering and feature parity

**Deliverables**

- Add ECharts 6 adapter.
- Port data gaps, actual/target series, fills, labels, patterns, axis titles, zoom, outcomes, tooltip visibility/customization, resizing, and reduced motion.
- Implement generic numeric formatters plus percentage preset.
- Implement property replacement for data/config/theme and protect focus when data length changes.

**Exit gate**

- Every feature in the version-one contract passes parity tests.
- Replacing inputs after first render updates canvas, table, descriptions, width, focus index, and events.
- No ECharts object or terminology appears in the public contract.

### Phase 3 - Complete the accessibility interaction model

**Deliverables**

- Complete the point-navigation spike and choose a valid model.
- Build the shared visual/accessibility state from one canonical data source.
- Correct contrast, unique relationships, table hiding, live-message timing, visible scroll synchronization, control target sizing, and forced-color behavior.
- Run the full responsive matrix and assistive-technology matrix.

**Exit gate**

- All provisional WCAG 2.2 AA audit findings are fixed and retested.
- WCAG 2.2 AA and Section 508 release gates pass.
- No body overflow from 320 through 1440 px; selected data stays visible inside intentional overflow.
- Required screen-reader flows pass with two instances and missing data.

### Phase 4 - Prove direct cross-framework use

**Deliverables**

- Plain HTML, Angular, React, Svelte, and Vue fixtures use the same built element directly.
- Each fixture sets complex properties, listens to `CustomEvent`s, imports CSS, updates data after mount, and removes/reinserts the element.
- Document initialization timing and `customElements.whenDefined()` where needed.

**Exit gate**

- No framework wrapper package exists or is required.
- The same package artifact and public API pass every fixture.
- Framework fixtures contain no component-specific workaround that belongs in the library.

### Phase 5 - Satisfy the current-plus-10 compatibility target

**Deliverables**

- Generate the dated browser-version manifest.
- Configure build/transpilation targets from the oldest supported versions.
- Add hosted-browser/device-lab execution for the historical matrix.
- Fix or document every version-specific behavior difference.

**Exit gate**

- Every available target version passes core render, controls, keyboard, update, lifecycle, and accessibility smoke tests.
- Unavailable versions are listed explicitly; no broader tested-support claim is made.
- Current physical screen-reader/mobile testing still passes.

### Phase 6 - Internal v1 release

**Deliverables**

- Internal package artifact and install instructions.
- Stable API reference, theming reference, accessibility statement, browser manifest, migration example, and changelog.
- Consumer integration in the specific initial use case.
- Error telemetry/feedback path that does not collect chart data by default.

**Exit gate**

- The real internal consumer passes its functional, visual, responsive, accessibility, and update flows.
- No blocker/high audit finding remains.
- Rollback to the previous internal implementation is documented.

### Phase 7 - Public open-source readiness

**Deliverables**

- MIT license file and correct package metadata.
- Public repository documentation, contribution guide, code of conduct, security policy, support policy, release process, and ownership.
- npm or GitHub Packages decision, name reservation, provenance/signing, and semantic versioning.
- Public examples and compatibility documentation.

**Exit gate**

- Legal/project metadata contains no placeholder text.
- Published artifacts reproduce from CI and match source tags.
- Public support statements match tested evidence.

### Phase 8 - Progressive enhancement

**Explicitly deferred from internal v1**

- Define authored Light DOM fallback markup, likely a real table or declarative data block present before custom-element upgrade.
- Preserve useful title/summary/data when JavaScript is unavailable, blocked, slow, or fails.
- Enhance existing fallback nodes instead of deleting and recreating them where practical.
- Test no-JavaScript, slow-JavaScript, upgrade, reconnect, and hydration-like ownership conditions.

The first public API must reserve room for this work by avoiding destructive child replacement and by keeping complex JSON attributes out of the stable v1 contract.

## Angular-to-Web-Component feature mapping

| Angular mechanism | Framework-free target |
|---|---|
| `@Component` | `class A11yLineChartElement extends HTMLElement` |
| `@Input() data` | `data` property with validated setter |
| Other simple `@Input()` values | Reflected properties/attributes |
| Signals/computed | Explicit internal state store + pure derivation |
| Angular change detection | Batched scheduled render/update method |
| Angular template directives | DOM creation/update functions |
| `NgxEchartsModule` | Direct ECharts adapter |
| Angular provider config | Adapter-owned ECharts import/init |
| Component events | Bubbling `CustomEvent`s |
| Global unscoped SCSS | Prefixed Light DOM CSS artifact |
| Static template IDs | Per-instance generated IDs |
| Generic focus overlay | Valid, tested point-navigation control |
| Raw HTML tooltip formatter | DOM-based tooltip renderer callback |
| Karma starter spec | Unit/component/browser/accessibility contracts |
| Angular demo app | Retained parity reference, then framework fixture |

## Work intentionally deferred

- Additional chart types.
- Arbitrary multi-series support.
- Framework wrapper packages.
- Final package name and registry.
- Public publishing automation.
- No-JavaScript progressive enhancement implementation.
- Advanced data loading/fetching inside the component; consumers remain responsible for retrieving data.

## Definition of “done perfectly” for internal v1

The internal version is done only when:

- it is a Light DOM autonomous custom element with no framework runtime;
- every current feature is preserved through a stable, documented public contract;
- a real internal consumer uses it directly;
- data/config/theme updates work after first render;
- empty, loading, invalid, missing, overflow, forced-color, and reduced-motion states are intentional;
- the chart, data table, controls, tooltip, focus, and announcements agree at all times;
- WCAG 2.2 AA and Section 508 gates pass with manual assistive-technology evidence;
- the full responsive matrix has no unintended body overflow;
- the supported-browser manifest and available current-plus-10 grid pass;
- plain HTML, Angular, React, Svelte, and Vue fixtures use the same artifact without wrappers;
- build, type checks, tests, accessibility automation, and package checks are green in CI;
- ECharts can be replaced without changing the public API;
- documentation states what is tested, what is provisional, and what is deferred.

## Immediate implementation queue

1. Protect and inventory the current Angular reference and uncommitted pattern work.
2. Create the parallel package directory and plain-HTML fixture.
3. Add strict TypeScript, current LTS Node tooling, unit/browser tests, and CI for the new package.
4. Implement registration, Light DOM ownership, unique IDs, prefixed CSS, validation, and empty/error states.
5. Add the ECharts adapter and port the current data/display behavior behind parity tests.
6. Run the point-navigation accessibility spike before copying the old generic focus overlay.
7. Complete audited accessibility and responsive corrections.
8. Add direct framework fixtures.
9. Add historical-browser infrastructure and publish the dated support manifest.
