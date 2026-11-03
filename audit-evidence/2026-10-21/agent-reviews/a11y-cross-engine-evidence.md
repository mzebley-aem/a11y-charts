# Keyboard-reading/browser accessibility probe — 2026-10-21

Read-only probe against the local chart fixture, using Playwright 1.64.1 with Chromium 155.0.8059.86 (Chrome channel), Firefox 157.0, and WebKit 27.2. Raw JSON is `/tmp/a11y-cross-engine-evidence.json`; the minimal runnable probe is `/tmp/a11y-cross-engine-probe.mjs`.

## Line period navigator

After focusing the native range input and pressing End, all three engines exposed these DOM values:

- Native `value`: `2`.
- `aria-valuetext`: `2025, 3 of 3. Target met. Actual 69%. Target 60%. 9 percentage points above target.`
- `aria-describedby`: only the localized keyboard-guidance node (no data table ID).
- Polite live region: the complete same 2025 narrative.

Playwright `locator.ariaSnapshot()` serializes the input as `slider "Chart period navigation": "2"` in all three engines. It does not show the DOM `aria-valuetext` narrative. The snapshot of the separate line data table starts with the table’s caption and then exposes headers/rows; the slider is not described by that table.

Chromium CDP `Accessibility.getPartialAXTree` also reports the component input’s `value: 2` and effective `valuetext: "2"`, while the DOM attribute is the full narrative. A minimal page-level native `<input type="range">` with an explicit different `aria-valuetext` likewise produces CDP `valuetext: "2"`. A separate `div role="slider"` with `aria-valuetext="Narrative on ARIA slider"` produces CDP `valuetext: ""`. This rules out a stale component attribute and shows that the discrepancy is not only Playwright’s snapshot text formatting. It indicates a Chrome accessibility-tree/CDP exposure issue for `aria-valuetext` in this environment. Firefox and WebKit were checked through Playwright snapshots only; those snapshots also show the native numeric value and do not establish what their platform accessibility APIs send to assistive technology.

The component’s live-region fallback is dynamically populated with the intended narrative in all three engines. DOM inspection proves the update and live-region attributes, not that a screen reader announced it.

## Bar-row buttons and table description

All three Playwright snapshots include each focused bar trigger’s accessible name as category, count/percentage, target comparison, target outcome, definition (if present), and the details action. Its `aria-describedby` points only to the keyboard-use instructions. The separate data table uses its own caption and row semantics; it is not attached as a full-table description to each button.

## Assessment

The current chart code writes the intended range text and maintains a live-region fallback. The test-only snapshots are not sufficient proof of actual spoken output. Chromium CDP independently reports numeric `valuetext` even in a plain native-range reproduction, so the observed mismatch is more than just Playwright’s ARIA snapshot serializer; however, this does not prove what VoiceOver, NVDA, or other assistive technologies announce. No screen reader or platform accessibility API was exercised. WAI-ARIA says `aria-valuetext`, when specified, should be rendered instead of `aria-valuenow`; the browser output here diverges from that expected exposure. [WAI-ARIA 1.2 `aria-valuetext`](https://www.w3.org/TR/wai-aria/#aria-valuetext).
