# A11y Charts docs

The documentation site, built with [Astro Starlight](https://starlight.astro.build).

Pages live in `src/content/docs/` as Markdown or MDX. The sidebar is set in
`astro.config.mjs`.

## Live examples

`src/components/ChartExample.astro` renders a real chart from the installed
package build and shows the code that produces it. The snippet is generated
from the same `properties` object, so the example and its code stay in sync:

```mdx
import ChartExample from '../../../components/ChartExample.astro';

<ChartExample type="bar" properties={{ chartTitle: 'By sex', data: [...], total: 27 }} />
```

The chart packages are installed with `file:` links, so the examples run each
package's built `dist`, the same artifact consumers install. Build the
packages before running the docs.

## Commands

From the repository root:

| Command | Action |
| --- | --- |
| `npm run packages:dist` | Build the chart packages' `dist` (needed once, and after package changes). |
| `npm run docs:dev` | Start the docs dev server at `localhost:4321`. |
| `npm run docs:build` | Build the packages, then the docs, to `docs/dist/`. |
| `npm run docs:typecheck` | Typecheck the example sources (after a build). |
| `npm run deploy:build` | Build the deployed site to `dist/site/`. |

## Examples and report prototypes

- `src/content/docs/examples/` holds the Examples pages. Line, bar, and grouped
  examples use `ExampleEntry`, which wraps `ChartExample` with a settings panel.
  The segmented and theme comparison pages load their own scripts.
- `src/pages/reports/` holds full-page report prototypes outside the docs
  layout. Each injects its `body.html` from `src/examples/` unchanged and loads
  its script, which also handles URL state.
- `src/examples/` holds the example data, settings panels, and report sources.
  `npm run docs:typecheck` checks them against the built package types.

## Deployment

Vercel runs `npm run deploy:build` (see `vercel.json`). The deployed site is the
docs, with the examples under `/examples/` and the report prototypes under
`/reports/`, plus each package's standalone demo at `/demo/target-line-chart.html` and
`/demo/bar-chart.html`. The former gallery URLs (`/spp-apr/`,
`/dispute-resolution/`, `/segmented/`, `/demo/report-demo.html`, and the
`/gallery/` paths from this site's first preview) redirect to their new pages.

## Browser tests

Build the docs first, then from the repository root:

| Command | Checks |
| --- | --- |
| `npm run browser:docs` | Every page's live examples, the Examples pages and settings panels, report shells, and an accessibility sweep. Set `PLAYWRIGHT_BROWSER` to `firefox` or `webkit` for another engine. |
| `npm run browser:grouped`, `browser:themes`, `browser:segmented`, `browser:spp-apr`, `browser:dispute-resolution` | Detailed Chromium suites for each example page and report. |
