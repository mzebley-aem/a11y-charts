# Audit fixes — October 21, 2026

The changes below address the concrete defects from
[AUDIT-2026-10-21.md](./AUDIT-2026-10-21.md). Three GPT-6 Luna agents implemented
bounded workstreams; the coordinating agent reviewed and integrated them and
added real-browser contract tests. Existing uncommitted work was preserved.

## Finding disposition

| Audit item | Disposition |
|---|---|
| Hidden line chart fails to initialize | Fixed: observe hidden container and defer initialization retry to an animation frame |
| Focus lost during line data updates | Fixed: stable focus keys, period identity, and fallback when a control becomes disabled/unavailable |
| Mutable point-event payloads | Fixed: Dates and nested differences copied; formatter/tooltip callback Date and model boundaries hardened too |
| Reconnected dialog loses modality | Fixed in both charts: explicit disconnect close/reopen lifecycle and stale native close-event guard |
| Invalid line config crashes rendering | Fixed: precision/boolean/enum/heading/nullish validation and malformed theme fallback; valid finite scales remain supported |
| Dependency findings | Both active package audits are clean after lockfile updates; root Angular reference findings remain outside the active verification workflow |
| Node/SSR helper imports fail | Fixed through exported `./core` entries, exercised by built-package Node smoke tests |
| English singular fallback | Fixed and covered |
| Event parity | Line source changes now include baseline, coalesce, and skip equivalent assignments; property display events added; both ready events carry instanceId |
| Retained unused input | Removed bar original-input reference and line retained invalid-input graph; line retains only localization error key/parameters |

Additional hardening: bar modal failures show a localized alert and emit an error
instead of silently opening a nonmodal dialog. Both charts invalidate stale
render callbacks across reconnects. Line frame callbacks are canceled during
render/disconnect. Large-array extrema no longer spread data into function
arguments. Bar reuses number/list formatters and a per-model message resolver
with a lazily reused plural-rules object. Line tables use canonical model text
for actual values rather than rerunning value formatting.

## Integration details

- Root scripts now verify active packages; the Angular commands are explicitly
  prefixed `reference:`. Angular source and dependencies were not migrated.
- `./core` imports avoid HTMLElement/registration. For server CSV metadata use
  `contextText` and `dataNoteText`. Even empty strings override rich metadata;
  HTML parsing without DOM APIs raises an instructional error in both packages.
- Line `display-change` retains existing control/legend payloads and adds a
  typed `source: 'properties'` payload. Consumers should narrow on source.
- Unit tests cover malformed configuration, localization, mutation isolation,
  equivalent/source/baseline event changes, reconnect state, and export metadata.
- Browser tests cover real hidden-container initialization, navigator/control
  focus, native modal state, delayed close events, live dialog updates, and
  shared source/display-event behavior. They assert no uncaught page errors.
- A GitHub Actions workflow verifies both packages and browser regressions. It
  has been added locally; no hosted CI run, commit, push, or deployment occurred.

## Remaining architecture work

The shared library and standalone library bundles are **not implemented** in
this pass. The current build remains TypeScript modules plus scoped CSS;
self-contained demos are separate artifacts. The existing `./core` entries are
per-chart import surfaces, not yet a shared source package.

Full persistent DOM/ECharts rendering, broader formatter caching on the line
side, lazy secondary data views, shared sanitizer/card/dialog implementation,
component-only bundle budgets, and heap profiling belong to the next staged
architecture pass. Human assistive-technology verification and cross-browser
release evidence remain necessary. This pass does not claim those are complete.

The proposed design and hover/focus-card boundaries are in
[SHARED-CORE-DISCUSSION.md](./SHARED-CORE-DISCUSSION.md).

## Final local verification

- Node 24.16.0: root `npm run verify` passed, including 110 line tests and
  99 bar tests, both typechecks, both builds, and both built Node core smokes.
- Installed Chrome via `PLAYWRIGHT_CHROMIUM_CHANNEL=chrome`: all 12 browser
  regression cases passed, including public data-view event sequences after
  queued native close events. No uncaught page errors were observed.
- Both standalone demo builds and the line report build passed; generated
  demo HTML was refreshed. The report retains the existing large-chunk warning.
- Both active package `npm audit` runs reported zero vulnerabilities.
- `git diff --check` passed. No commit, push, or deployment was performed.

## Shared-library implementation follow-up

Implemented the approved extraction with three GPT-6 Luna agents. The private
`packages/chart-core/src` source library now owns shared sanitization, CSV cell
encoding, validation primitives, targets, formatting/message helpers, card markup,
floating-card behavior, modal lifecycle/focus handling, and disclosure helpers.
Both chart packages compile the portions they use into their own distribution.
Line tooltip interaction remains ECharts-owned; its default markup is shared.
Bar category cards use the shared floating-card controller. Chart semantics and
namespaced CSS remain chart-owned. Ordinary line updates retain the canvas and
ECharts adapter.

Each package builds a classic `dist/chart.js`, ESM API/registration/core entries,
and `dist/styles.css`. Packed types resolve in a fresh consumer without ECharts
or workspace dependencies, with library checking enabled. Line includes required
third-party license notices. The packages are still private and unpublished.

Verification on October 21, 2026:

- 123 line unit tests and 99 bar unit tests passed.
- Both typechecks, package builds, and fresh packed Node/TypeScript consumer checks passed.
- 12 source browser regressions and 8 packed-artifact browser checks passed in Chrome.
- Packed tests block external requests and serve only files extracted from npm archives.
- Tested independent classic/ESM loading, co-loading, repeated registration,
  native dialogs, hover/pin/Escape, touch pointer behavior, 320px layout,
  forced colors/reduced motion, and persistent line canvas identity.
- Both demo builds and the line report build passed.
- Full dependency audits of both active chart packages reported zero vulnerabilities.
- `git diff --check` passed.

The packed tests caught and led to fixing an ECharts `process.env.NODE_ENV`
reference that would otherwise fail in a plain browser. They also guard against
future accidental external runtime dependencies. CI now runs these checks.

No retained-heap benchmark or manual screen-reader certification was performed
in this extraction. Surrounding line DOM and bar rows still rebuild. Shared visual
tokens, broader incremental rendering, and measured heap/performance budgets
remain follow-up work. Frozen root Angular dependencies are outside these active
package audit results. No commit, push, publication, or deployment was performed.
