# Grouping implementation and verification

Implemented with a GPT-6.1 Terra cohort and parent integration review.

## Approved behavior

- Breakdown display has a firm maximum of four segments, including generated Other categories.
- Automatic grouping applies only above four source categories. `segmentOrder` chooses the three separate categories by value (default), supplied order, or locale-aware label order. Ties retain source order. Four or fewer source categories keep their original order.
- Explicit `separateCategoryIds` accepts an ordered list of up to three unique nonempty IDs. It overrides automatic selection even below five source categories. Empty selection groups everything; absent IDs are skipped without filling slots.
- Other stays last and is omitted when no records remain. Highlight conflicts are configuration errors; membership is never silently changed to accommodate a highlight.
- Missing members withhold the aggregate as Incomplete. Any protected member makes the aggregate Suppressed. No partial total/percentage/geometry is produced. Protected numeric accessors are not read or ranked.
- Original source rows, data tables, CSV and Excel remain complete and retain source order. Generated display segments have collision-free keys and a category/other discriminant. Comparisons ignore grouping options.
- Other details list safe original members and percentages of the whole chart. Compact linked charts can retain navigation without member controls; consuming pages provide full data at the destination.

## Demo

`http://127.0.0.1:5191/segmented/#grouping-heading` provides source/value/alphabetical selection, ordered explicit choices, incomplete-data and three/six-category scenarios, a refresh that changes top-three membership, and a highlight-conflict toggle. English/French/Spanish component catalogs include new grouping messages.

## Verification results

- Segmented package: **50 unit tests passed**, including 108 partition-invariant combinations, unknown/empty selections, ID collisions, ordering, unchanged original exports, overflow, suppression/accessor protection, focus recovery and hover traversal.
- Segmented browser suite: **8 passed**. Dispute-resolution regression suite: **6 passed**.
- Axe WCAG 2.2 AA scans passed for tested default and expanded views, including grouped details. Keyboard, data updates, CSV/Excel, forced-colors, reduced-motion, text spacing and enlarged text scenarios are exercised by browser tests.
- A 40-member Other group remained accessible at 1440, 768, 390 and 320px, without horizontal overflow or truncated member lists. The final member link remained keyboard reachable. Escape returns focus to Other instead of leaving focus in hidden content.
- Package and gallery TypeScript checks, package build with fresh packed-consumer smoke test, assembled site build, and whitespace check passed. Existing Vite large-chunk advisories remain.
- Rendered evidence: `tmp/segmented/grouped-details.png`.

## Review corrections and limitations

Review removed an initial silent highlight reservation, added namespaced display keys, preserved status labels with numeric annotations hidden, and corrected Escape focus when a member definition link is focused. Segment hover dismissal now allows pointer travel into details.

This is automated/browser evidence, not a conformance certification. Hands-on screen-reader, braille and participant validation remain unperformed. No commit, push or deployment was performed.
