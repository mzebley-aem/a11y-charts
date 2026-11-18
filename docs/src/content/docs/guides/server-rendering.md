---
title: Server rendering
description: Use the /loader entry so chart registration is safe in SSR and prerendering.
---

The package root and `/define` evaluate classes that extend `HTMLElement`. Importing either in Node throws `ReferenceError: HTMLElement is not defined`, which breaks server rendering and prerendering.

From any code that also runs on the server, register through `/loader` instead:

```ts
import { loadA11yTargetLineChart } from '@mzebley-aem/target-line-chart/loader';
import { loadA11yBarChart } from '@mzebley-aem/bar-chart/loader';
import { loadA11ySegmentedBarChart } from '@mzebley-aem/segmented-bar-chart/loader';

await loadA11ySegmentedBarChart(); // true in the browser once registered, false on the server
```

`/loader` has no static imports. In a browser it lazily imports `/define`, so it registers the same constructors the package root exports, and repeated calls share one load. On the server it resolves to `false` and loads nothing.

These stay safe on the server:

- `import type` from the package root, which is erased at compile time.
- `/core`, which is DOM-free. Use it to validate data, build the semantic model, or produce CSV on the server.

The server renders the empty element tag. The chart draws itself once the loader has registered it in the browser.
