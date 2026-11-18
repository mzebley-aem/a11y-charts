---
title: Installation
description: Install the chart packages from GitHub Packages and register the custom elements.
---

The charts are published to GitHub Packages under the `@mzebley-aem` scope. Each chart is its own package, so install only the ones a report uses:

| Package | Element |
| --- | --- |
| `@mzebley-aem/target-line-chart` | `<a11y-target-line-chart>` |
| `@mzebley-aem/bar-chart` | `<a11y-bar-chart>`, `<a11y-bar-chart-group>` |
| `@mzebley-aem/segmented-bar-chart` | `<a11y-segmented-bar-chart>` |

None of the packages has runtime dependencies. The target line chart bundles its ECharts renderer, and every package compiles its shared code in, so there is no shared runtime to load separately.

## Configure the registry

GitHub Packages always needs a token to install, even for public packages.

1. Add an `.npmrc` next to the consuming project's `package.json`:

   ```ini
   @mzebley-aem:registry=https://npm.pkg.github.com
   //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
   ```

2. Provide `NODE_AUTH_TOKEN`:
   - **Locally:** a GitHub personal access token (classic) with the `read:packages` scope.
   - **GitHub Actions:** the workflow's `GITHUB_TOKEN` with `permissions: packages: read`. If that token can't read a package owned by another account, store a `read:packages` token as a repository secret instead.
   - **Docker builds:** pass the token as a build secret, not a build argument, so it doesn't end up in an image layer:

     ```dockerfile
     RUN --mount=type=secret,id=npm_token NODE_AUTH_TOKEN=$(cat /run/secrets/npm_token) npm ci
     ```

3. Install:

   ```bash
   npm install @mzebley-aem/target-line-chart @mzebley-aem/bar-chart @mzebley-aem/segmented-bar-chart
   ```

## Register the elements

Import the stylesheet and the `/define` entry once, anywhere in the browser bundle. `/define` registers the element; registering twice is safe.

```ts
import '@mzebley-aem/bar-chart/define';
import '@mzebley-aem/bar-chart/styles.css';
```

Every package has the same entry points:

| Entry | Use |
| --- | --- |
| `/define` | Registers the element(s). Browser only. |
| `/styles.css` | The chart's stylesheet. Every class is prefixed and scoped to the element. |
| `.` (package root) | The element class and types, without registering. |
| `/core` | DOM-free validation, model, formatting, and CSV helpers. Safe in Node. |
| `/loader` | Registers lazily in the browser and does nothing on the server. See [Server rendering](/guides/server-rendering/). |
| `/chart.js` | A standalone browser build for pages without a bundler. |

For type-only imports, use `import type` so nothing runs:

```ts
import type { A11yBarChartElement } from '@mzebley-aem/bar-chart';
```

Next, [build your first chart](/getting-started/first-chart/).
