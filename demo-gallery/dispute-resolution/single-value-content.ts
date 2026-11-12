/** Authored context for single-value panels; counts remain in data.ts. */
interface SingleValueContent {
  eyebrow: string;
  title?: string;
  question?: string;
  baseCaption?: string;
  label?: string;
  remainderLabel: string;
  definition: string;
  remainderNote: string;
  sentence: string;
  note?: string;
}
export const singleValueContent: Record<string, SingleValueContent> = {
  'written-findings': {
    eyebrow: 'Findings of noncompliance',
    remainderLabel: 'Other issued reports',
    definition: 'An issued complaint report that included findings that IDEA requirements were not met.',
    remainderNote: 'The report does not separately describe findings or outcomes for the remaining issued reports. This remainder does not establish that they were compliant.',
    sentence: '{value} ({share}) of the {base} issued reports included findings of noncompliance.',
  },
  'written-pending': {
    eyebrow: 'Complaints pending due process',
    title: 'Written signed complaints pending a due process hearing',
    question: 'How many of the complaints still pending are waiting on a due process hearing about the same concerns?',
    baseCaption: 'pending',
    label: 'pending a due process hearing',
    remainderLabel: 'Other pending complaints',
    definition: 'A pending written signed complaint waiting on a due process hearing about the same concerns.',
    remainderNote: 'The report does not specify their reasons for remaining pending.',
    sentence: '{value} ({share}) of the {base} complaints pending were pending a due process hearing.',
  },
  'dueprocess-meetings': {
    eyebrow: 'Resolution meeting activity',
    remainderLabel: 'Remainder of complaint total (calculated)',
    definition: 'A resolution meeting held in the due process procedure to give the parties an opportunity to resolve their disagreement.',
    remainderNote: 'Meetings and complaints are different reporting units. This arithmetic difference does not identify complaints without a meeting.',
    sentence: '{value} resolution meetings were held, equivalent to {share} of the {base} due process complaints filed.',
    note: 'Meeting activity overlaps complaint status. This comparison is not a sequence of stages or a count of complaints without a meeting.',
  },
  'dueprocess-settlements': {
    eyebrow: 'Resolution meeting outcomes',
    remainderLabel: 'Other resolution meetings',
    definition: 'A resolution meeting that resulted in a written settlement agreement between the parties.',
    remainderNote: 'The report does not separately describe the outcomes of the remaining resolution meetings.',
    sentence: '{value} ({share}) of the {base} resolution meetings resulted in a written settlement agreement.',
  },
  'expedited-meetings': {
    eyebrow: 'Expedited resolution meeting activity',
    remainderLabel: 'Remainder of complaint total (calculated)',
    definition: 'A resolution meeting held as part of an expedited due process procedure.',
    remainderNote: 'Meetings and complaints are different reporting units. This arithmetic difference does not identify complaints without a meeting.',
    sentence: '{value} expedited resolution meetings were held, equivalent to {share} of the {base} expedited due process complaints filed.',
    note: 'Meeting activity overlaps complaint status. This comparison is not a sequence of stages or a count of complaints without a meeting.',
  },
  'expedited-settlements': {
    eyebrow: 'Expedited resolution meeting outcomes',
    remainderLabel: 'Other expedited resolution meetings',
    definition: 'An expedited resolution meeting that resulted in a written settlement agreement.',
    remainderNote: 'The report does not separately describe the outcomes of the remaining expedited resolution meetings.',
    sentence: '{value} ({share}) of the {base} expedited resolution meetings resulted in a written settlement agreement.',
  },
  'expedited-placement': {
    eyebrow: 'Expedited hearing outcomes',
    remainderLabel: 'Other fully adjudicated expedited hearings',
    definition: 'A fully adjudicated expedited hearing whose written decision ordered a change of placement.',
    remainderNote: 'This remainder does not describe which party prevailed or classify other hearing outcomes.',
    sentence: '{value} ({share}) of the {base} fully adjudicated expedited hearings ordered a change of placement.',
    note: 'This subset is not the total number of hearings or a measure of which party prevailed.',
  },
};
