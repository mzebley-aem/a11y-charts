import type { BarViewSection, PreparedBarView } from '../packages/bar-chart/src/grouped-model.js';
import type { A11yBarChartDatum } from '../packages/bar-chart/src/model.js';
import { prepareBarViewSection } from '../packages/bar-chart/src/prepare-views.js';

const categories = [
  { id: 'home', label: 'Home', definition: 'Services provided in the child’s home.' },
  { id: 'community', label: 'Community-Based Setting', definition: 'Services in a community setting such as a child care program.' },
  { id: 'other', label: 'Other Setting', definition: 'Services provided in other settings.' }
];
const rows = (values: (number | null)[], withheld = false): A11yBarChartDatum[] => categories.map((category, index) => ({
  ...category, value: withheld && index > 0 ? 0 : values[index] ?? null
}));
function view(id: string, label: string, total: number, data: A11yBarChartDatum[], filtered: boolean, screenshot: boolean, description: string): PreparedBarView {
  return { id, label, chartTitle: label, total, data, filtered, suppressed: screenshot || data.some(row => row.value === 0),
    context: description,
    explanation: `<p>The selected population is <strong>${total}</strong> children, or ${(total / 510 * 100).toFixed(2)}% of the overall population of 510. Each bar’s percentage uses the selected population as its denominator.</p><p>Suppressed values are intentionally withheld.</p>`,
    dataNote: screenshot ? 'Visible values and totals transcribed from the supplied screenshot. Definitions are illustrative. The full underlying dataset was not supplied.' : 'Illustrative selection data for reviewing the interaction; these values are not production data.' };
}
export function ageSection(): BarViewSection {
  return { id: 'age', label: 'Age range', description: 'Choose an age range to see specific data and insights.', allViewId: 'age-all', views: [
    view('age-all', 'All Ages', 510, rows([365, 80, 20]), false, true, 'There are 510 (100.00%) children, ages birth through 2, served in various settings.'),
    view('birth-1', 'Birth to 1', 135, rows([110, 20, 5]), true, false, 'Illustrative selection: 135 children (26.47% of the overall population).'),
    view('age-1-2', '1 to 2', 180, rows([140, 30, 10]), true, false, 'Illustrative selection: 180 children (35.29% of the overall population).'),
    view('age-2-3', '2 to 3', 195, rows([115, 30, 5]), true, false, 'Illustrative selection: 195 children (38.24% of the overall population). The authoritative total exceeds the sum of displayed categories.')
  ] };
}
export function raceSection(): BarViewSection {
  const names = ['American Indian or Alaska Native', 'Asian', 'Black or African American', 'Hispanic/Latino', 'Two or more races', 'Native Hawaiian or Other Pacific Islander', 'White'];
  return { id: 'race', label: 'Race/ethnicity', description: 'Choose a race/ethnicity to see specific data and insights.', allViewId: 'race-all', views: [
    view('race-all', 'All Race/Ethnicities', 510, rows([322, null, null], true), false, true, 'There are 510 (100.00%) children, of all race/ethnicity, served in various settings.'),
    ...names.map((label, index) => label === 'Black or African American'
      ? view('black', label, 102, rows([102, null, null], true), true, true, 'There are 102 (20.00%) children, that are Black or African American, served in various settings.')
      : view(`race-${index}`, label, 40 + index * 5, rows([30 + index * 5, 8, 2]), true, false, `Illustrative selection: ${40 + index * 5} children (${((40 + index * 5) / 510 * 100).toFixed(2)}% of the overall population).`))
  ] };
}
export function availabilitySection(): BarViewSection {
  return prepareBarViewSection({
    id: 'availability', label: 'Data availability', description: 'Compare reported, suppressed, missing, and empty results.', suppressed: true,
    all: { id: 'availability-all', label: 'All demonstration records', total: 100 },
    options: [{ id: 'mixed', label: 'Mixed availability', total: 100 }, { id: 'zero', label: 'Fully suppressed', total: 0 }, { id: 'empty', label: 'No matching records' }],
    records: [
      { filterId: 'mixed', id: 'reported', label: 'Reported', value: 40 },
      { filterId: 'mixed', id: 'withheld', label: 'Small group', value: 0 },
      { filterId: 'mixed', id: 'missing', label: 'Not reported', value: null },
      { filterId: 'zero', id: 'withheld', label: 'Small group', value: 0 }
    ],
    describe: ({ option }) => ({ chartTitle: option.label,
      emptyMessage: 'No records match this selection. Choose another population to continue.',
      context: 'Fictional records demonstrate distinct availability states. Protected values were replaced with zero before reaching the chart, and the chart is flagged as suppressed.',
      explanation: '<p>A suppressed value is protected and arrives as zero. A missing value has not been reported. A view with no records has no categories to display.</p>',
      dataNote: 'Entirely illustrative data. The population total is supplied separately from the disclosed counts.' })
  });
}

/** Fictional counts and independently authored goals, expressed in the same units. */
export function targetSection(): BarViewSection {
  const services = ['Home visits', 'Community sessions', 'Family consultations'];
  const make = (id: string, label: string, counts: number[], targets: A11yBarChartDatum['target'][], total: number): PreparedBarView => ({
    id, label, chartTitle: `${label}: completed services`, total,
    filtered: id !== 'regions-all', suppressed: false,
    context: 'Fictional completed services compared with goals for the selected region. Counts and targets share a fixed scale of 180.',
    explanation: '<p>Home visits and family consultations have minimum count goals: meeting or exceeding the target meets the goal. Community sessions have an acceptable range: both endpoints are included.</p><p>Targets belong to the selected region. Percentages describe each service’s share of that region’s completed services, not progress toward its target.</p>',
    dataNote: 'Entirely fictional demonstration data and targets. These are count goals, not percentage targets.',
    data: services.map((service, index) => ({ id: ['home-visits', 'community-sessions', 'consultations'][index]!, label: service, value: counts[index]!, target: targets[index],
      definition: index === 1 ? 'Completed community sessions, with an acceptable count range.' : 'Completed services, with a minimum count goal.' }))
  });
  return { id: 'regions', label: 'Service region', allViewId: 'regions-all',
    description: 'Choose a region to compare completed services with its targets.',
    views: [
      make('regions-all', 'All regions', [160, 110, 80], [150, { min: 90, max: 120 }, 90], 350),
      make('north', 'North region', [60, 50, 20], [50, { min: 30, max: 40 }, 30], 130),
      make('south', 'South region', [100, 60, 60], [100, { min: 60, max: 80 }, 60], 220)
    ] };
}
