// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// Vercel sets the production domain at build time; it enables canonical URLs
// and the sitemap. Local builds leave it unset.
const productionHost = process.env.VERCEL_PROJECT_PRODUCTION_URL;

// https://astro.build/config
export default defineConfig({
	site: productionHost ? `https://${productionHost}` : undefined,
	vite: {
		// The segmented examples reuse the bar package demo's translations.
		server: { fs: { allow: ['..'] } },
	},
	integrations: [
		starlight({
			title: 'A11y Charts',
			description:
				'Framework-free, accessible chart components for ADAPT reports: line, bar, and segmented bar charts.',
			social: [
				{ icon: 'github', label: 'GitHub', href: 'https://github.com/mzebley-aem/a11y-charts' },
			],
			editLink: {
				baseUrl: 'https://github.com/mzebley-aem/a11y-charts/edit/main/docs/',
			},
			customCss: ['./src/styles/custom.css'],
			sidebar: [
				{
					label: 'Getting started',
					items: [
						{ label: 'Installation', slug: 'getting-started/installation' },
						{ label: 'Your first chart', slug: 'getting-started/first-chart' },
					],
				},
				{
					label: 'Charts',
					items: [
						{ label: 'Target line chart', slug: 'charts/target-line-chart' },
						{ label: 'Bar chart', slug: 'charts/bar-chart' },
						{ label: 'Grouped bar chart', slug: 'charts/grouped-bar-chart' },
						{ label: 'Segmented bar chart', slug: 'charts/segmented-bar-chart' },
					],
				},
				{
					label: 'Guides',
					items: [
						{ label: 'Data views', slug: 'guides/data-views' },
						{ label: 'Suppression and missing data', slug: 'guides/suppression-and-missing-data' },
						{ label: 'Text and localization', slug: 'guides/text-and-localization' },
						{ label: 'Theming', slug: 'guides/theming' },
						{ label: 'Server rendering', slug: 'guides/server-rendering' },
					],
				},
				{
					label: 'Reference',
					items: [{ label: 'Events', slug: 'reference/events' }],
				},
				{
					label: 'Examples',
					items: [
						{ label: 'Overview', slug: 'examples' },
						{ label: 'Target line charts', slug: 'examples/target-line-charts' },
						{ label: 'Bar charts', slug: 'examples/bar-charts' },
						{ label: 'Grouped bar charts', slug: 'examples/grouped-bar-charts' },
						{ label: 'Segmented bar charts', slug: 'examples/segmented-bar-charts' },
						{ label: 'Theme comparison', slug: 'examples/theme-comparison' },
					],
				},
			],
		}),
	],
});
