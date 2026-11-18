// Builds the code shown under a live example. Used at build time for the static
// snippet and in the browser for the snippet that follows the settings panel, so
// both always describe the chart the same way.

export type ChartType = 'line' | 'bar' | 'group' | 'segmented';

export const CHARTS = {
	line: { tag: 'a11y-target-line-chart', pkg: '@mzebley-aem/target-line-chart' },
	bar: { tag: 'a11y-bar-chart', pkg: '@mzebley-aem/bar-chart' },
	group: { tag: 'a11y-bar-chart-group', pkg: '@mzebley-aem/bar-chart' },
	segmented: { tag: 'a11y-segmented-bar-chart', pkg: '@mzebley-aem/segmented-bar-chart' },
} as const;

/** JSON with bare identifier keys, closer to how the code is written by hand. */
const literal = (value: unknown) => JSON.stringify(value, null, 2).replace(/"([A-Za-z_$][\w$]*)":/g, '$1:');

export function chartSnippet(type: ChartType, attributes: Record<string, string>, properties: Record<string, unknown>): string {
	const { tag, pkg } = CHARTS[type];
	const attributeText = Object.entries(attributes)
		.map(([name, value]) => ` ${name}="${value}"`)
		.join('');
	return [
		`import '${pkg}/define';`,
		`import '${pkg}/styles.css';`,
		'',
		`// <${tag}${attributeText}></${tag}>`,
		`const chart = document.querySelector('${tag}');`,
		...Object.entries(properties).map(([key, value]) => `chart.${key} = ${literal(value)};`),
	].join('\n');
}
