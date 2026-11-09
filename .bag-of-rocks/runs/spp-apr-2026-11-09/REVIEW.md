# Bag of Rocks: preschool result, link, and review note

Run `spp-apr-2026-11-09`, skill 0.4.1. Production baseline `882b103`.

## In 90 seconds

The synthetic reader found Measure 6B, read its 28.12% result against the detailed 18.29% target, saw a link-copy confirmation, and typed a note. It stopped before local save, download, or sending anything. This supports UI-observed preparation, not persisted or delivered feedback.

Two issues were exposed: the reader skipped the source discrepancy and repeated the target without qualification (C5/C11), and finding sharing/feedback required substantial scrolling (C7/C9/C10). The corrected report puts “Target needs confirmation” in the 6B overview/result badges and adds copy/review actions next to the selected measure. Download is now the primary feedback action; local saving remains explicit and available.

[Annotated filmstrip](filmstrip.html) · [Frozen readable trace](trace-readable.md) · [Tester hashes](tester-frozen-sha256.json).

## Findings

### F1 — Conflicting target outside the headline result

**Source:** rock-exposed. **Category:** UX. **Severity:** High. **Steps:** C5, C11. **Traits:** Helper-Text Skipper, Literalist. **Component:** report result summary, reproduced by expert inspection.

The trace explicitly ignores the source-discrepancy paragraph and the typed note treats 18.29% as an unqualified target. The everyday result remains understandable, but uncertainty is lost. This is evidence of an omitted caveat in this synthetic attempt, not a measurement of real users’ certainty or prevalence.

**Smallest fix:** make “Target needs confirmation” the main outcome badge in both overview and selected measure, identify the detailed target as under review, and phrase the comparison as conditional. **Success signal:** uncertainty appears before supporting helper text. **Regression:** do not change source numbers or imply every measure is uncertain. **Ablation:** remove Helper-Text Skipper to test whether body-text reading changes the outcome.

### F2 — Review actions far from the selected result

**Source:** rock-exposed. **Category:** UX. **Severity:** Medium. **Steps:** C7, C9, C10. **Component:** report review actions, reproduced.

After reading the result, the reader scrolls up two screens to copy, then down four plus two-and-a-half screens to find the note field. It recovers, but loses the result context and incurs unnecessary travel.

**Smallest fix:** measure-local copy and review links, plus a header review shortcut at mobile widths. **Success signal:** from the selected measure, copy the correct URL and navigate directly to a focused feedback section. **Regression:** retain indicator, measure, chart view, and display settings in the copied link; never imply the URL contains notes. **Ablation:** repeat at desktop width.

### F3 — Local save is primary for a sharing-oriented task

**Source:** reviewer-observed hypothesis. **Category:** UX. **Severity:** Low. **Step:** C11. **Traits:** Visual-Path Follower, Helper-Text Skipper. **Component basis:** inferred.

The tester says it would press the blue local-save button. It correctly knows the note has not been shared and does not perform that action. No false belief of delivery or actual save failure was observed.

**Smallest fix:** prioritize Download review notes and preserve explicit secondary local save. **Success signal:** the task’s shareable artifact is the first, primary action; instructions say nothing is submitted automatically. **Regression:** keep local saving and storage-denial recovery. **Ablation:** remove Visual-Path Follower to test action hierarchy.

## Assumptions tested and divergence

| Intended step | Observed route | Assumption |
| --- | --- | --- |
| I1 Select Preschool Environments | C1–C2, ordinary scroll and selection | Held |
| I2 Read Measure 6B’s result | C3–C5, correct selected measure and numeric comparison | Held |
| I3 Inspect comparison and source discrepancy | C5 skips the discrepancy; no comparison/source inspection | Failed; unrecovered |
| I4 Prepare link and review note | C7–C11, copy acknowledgment and typed note, long scroll | Recovered; save/delivery not exercised |

## Recurrence and phrasing

This is one baseline attempt. No cross-run recurrence or population-level conclusion is claimed. The exact note is preserved in the frozen trace. It requests discussion of improvement and repeats the detailed target without the source caveat. No phrasing ablation was run.

## Harness artifacts and errata

- The tester originally described a nonexistent summary in C2, then added a correction. The C2 screenshot/correction, not the mistaken description, informs this review.
- Control+Home did not move the macOS browser at C6. Treat this as a platform/tooling shortcut artifact, not a site keyboard defect.
- Several checkpoints omit an explicit expectation field. The original files remain unchanged. The conversion script reported no trace problems.

## Limits

- Context blindness: fresh agent with `fork_turns=none`. Packet was generated without neutrality warnings and frozen before dispatch; SHA-256 `4e3917fdcb7f07bba6d6ad9c22d43d39504484952f537f56bef76b3c142ed42d`.
- File access: shared filesystem with instruction-based blinding, not an enforced sandbox. Perception: mixed, because tab creation automatically exposed accessibility text; screenshot-based decisions were requested.
- A fresh browser context was requested; browser storage isolation was not independently verified. No previous note was visible before entry.
- Conditions: 390 × 844 CSS pixels, public visitor, full-bag, own-words, at most 18 actions/12 minutes. Production mutations none. No save, download, submission, send, payment, or permission change.
- This walkthrough produces synthetic hypotheses, not real human research or estimated failure rates.
- Calibration: **not calibrated**. No reviewer verdicts or ablations were collected.
- Deterministic reviewer regressions verify the implemented fixes; they do not constitute a fresh blind retest or prove that everyone will succeed.

## Regression evidence

The report suite checks headline uncertainty, rate semantics, measure-local link copying, direct feedback focus, native fragment focus, Back/Forward restoration, draft retention, keyboard chart-series controls, and reflow. The raw baseline trace is frozen and never edited. See the accessibility review for broader automated/manual scope and limitations.
