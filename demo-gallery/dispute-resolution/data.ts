/** Transcribed from the supplied “Part B Dispute Resolution Report.html”,
 * Component.data() and overviewCards. Example values; no state identified.
 * Totals are denominators, never additional category rows. No complements inferred.
 */
export interface Panel {
  id: string;
  title: string;
  question: string;
  base: number;
  baseLabel: string;
  rows: [string, number][];
  note: string;
}
export interface ReportSection {
  id: string;
  title: string;
  total: number;
  unit: string;
  description: string;
  takeaway: string;
  panels: Panel[];
}
export const sections: ReportSection[] = [
  {
    id: 'written', title: 'Written signed complaints', total: 1284, unit: 'complaints filed',
    description: 'A written State complaint asks the State to investigate an alleged violation of IDEA requirements by a public agency.',
    takeaway: '822 complaints had reports issued. Of those reports, 318 included findings of noncompliance.',
    panels: [
      { id: 'written-status', title: 'Complaint status', question: 'What was the status of the complaints?', base: 1284, baseLabel: 'written signed complaints filed', rows: [['Reports issued', 822], ['Pending', 251], ['Withdrawn or dismissed', 211]], note: 'These three statuses add up to the 1,284 complaints filed.' },
      { id: 'written-findings', title: 'Reports with findings of noncompliance', question: 'How many issued reports included findings?', base: 822, baseLabel: 'complaints with reports issued', rows: [['Reports with findings of noncompliance', 318]], note: 'This is a subset of the 822 issued reports, not of all 1,284 complaints. The report does not separately label the remaining reports.' },
      { id: 'written-timelines', title: 'Report timelines', question: 'When were reports issued?', base: 822, baseLabel: 'complaints with reports issued', rows: [['Within standard timeline', 691], ['Within extended timeline', 131]], note: 'The report assigns all 822 reports to these two categories. Extended timelines are shown separately; they are not labeled late or out of compliance.' },
      { id: 'written-pending', title: 'Pending a due process hearing', question: 'How many pending complaints were waiting on a hearing?', base: 251, baseLabel: 'pending written signed complaints', rows: [['Pending a due process hearing', 43]], note: '43 of the 251 pending complaints (17.13%) were pending a due process hearing. This subset is already included in complaint status.' },
    ],
  },
  {
    id: 'mediation', title: 'Mediation', total: 928, unit: 'mediation requests',
    description: 'Mediation is a voluntary process in which an impartial mediator helps families and public agencies resolve disagreements about special education.',
    takeaway: '524 mediations were held. There were 301 mediation agreements: 98 related to due process and 203 not related to due process.',
    panels: [
      { id: 'mediation-status', title: 'Mediation request status', question: 'What happened to mediation requests?', base: 928, baseLabel: 'mediation requests received', rows: [['Mediations held', 524], ['Pending', 89], ['Withdrawn or not held', 315]], note: 'Held, pending, and withdrawn or not held add up to the 928 requests received.' },
      { id: 'mediation-held', title: 'Mediations held by due process relationship', question: 'Were held mediations related to due process?', base: 524, baseLabel: 'mediations held', rows: [['Related to due process complaints', 177], ['Not related to due process complaints', 347]], note: 'These categories describe the 524 mediations held. They do not describe all requests.' },
      { id: 'mediation-agreements', title: 'Mediation agreements by due process relationship', question: 'How were the agreements distributed?', base: 301, baseLabel: 'mediation agreements', rows: [['Related to due process complaints', 98], ['Not related to due process complaints', 203]], note: 'Percentages here describe the 301 agreements, not the 524 mediations held. These are agreement counts, not success rates by due process relationship.' },
    ],
  },
  {
    id: 'dueprocess', title: 'Due process complaints', total: 614, unit: 'complaints filed',
    description: 'A due process complaint raises a disagreement about special education. The process may involve a resolution meeting, a settlement, or a hearing with a written decision.',
    takeaway: '59 hearings were fully adjudicated. Separately, 251 resolution meetings were held, and 88 resulted in written settlement agreements.',
    panels: [
      { id: 'dueprocess-status', title: 'Complaint status', question: 'What was the status of due process complaints?', base: 614, baseLabel: 'due process complaints filed', rows: [['Hearings fully adjudicated', 59], ['Pending', 116], ['Withdrawn or dismissed, including resolved without a hearing', 439]], note: 'These three categories add up to 614. Resolution meetings are shown separately because they overlap these statuses.' },
      { id: 'dueprocess-meetings', title: 'Resolution meetings held', question: 'How many resolution meetings were held?', base: 614, baseLabel: 'due process complaints filed', rows: [['Resolution meetings held', 251]], note: 'Meeting activity overlaps complaint status. Do not add 251 to the status counts or interpret the charts as sequential stages.' },
      { id: 'dueprocess-settlements', title: 'Written settlement agreements', question: 'How many resolution meetings resulted in an agreement?', base: 251, baseLabel: 'resolution meetings held', rows: [['Meetings resulting in a written settlement agreement', 88]], note: '88 of 251 resolution meetings (35.06%) resulted in a written settlement agreement. The denominator is meetings, not complaints filed.' },
      { id: 'dueprocess-timelines', title: 'Hearing decision timelines', question: 'When were decisions issued?', base: 59, baseLabel: 'hearings fully adjudicated', rows: [['Within standard timeline', 45], ['Within extended timeline', 14]], note: 'Both categories refer to the 59 fully adjudicated hearings. An extended timeline is not, by itself, evidence of noncompliance.' },
    ],
  },
  {
    id: 'expedited', title: 'Expedited due process complaints', total: 76, unit: 'complaints filed',
    description: 'Expedited due process addresses certain disagreements about discipline and placement on a shortened schedule. This section describes expedited complaints, resolution meetings, and hearing outcomes.',
    takeaway: '26 expedited hearings were fully adjudicated. Of those, 8 ordered a change of placement. Separately, 12 of 38 expedited resolution meetings resulted in written settlement agreements.',
    panels: [
      { id: 'expedited-status', title: 'Expedited complaint status', question: 'What was the status of expedited complaints?', base: 76, baseLabel: 'expedited due process complaints filed', rows: [['Hearings fully adjudicated', 26], ['Pending', 9], ['Withdrawn or dismissed', 41]], note: 'These three categories add up to 76. Expedited resolution meetings overlap these statuses and are shown separately.' },
      { id: 'expedited-meetings', title: 'Expedited resolution meetings held', question: 'How many expedited resolution meetings were held?', base: 76, baseLabel: 'expedited due process complaints filed', rows: [['Expedited resolution meetings held', 38]], note: 'Meeting activity overlaps complaint status. It is not an additional status or a separate group of children.' },
      { id: 'expedited-settlements', title: 'Expedited written settlement agreements', question: 'How many meetings resulted in a settlement?', base: 38, baseLabel: 'expedited resolution meetings held', rows: [['Meetings resulting in a written settlement agreement', 12]], note: '12 of 38 expedited resolution meetings (31.58%) resulted in a written settlement agreement.' },
      { id: 'expedited-placement', title: 'Changes of placement ordered', question: 'How many adjudicated hearings ordered a change of placement?', base: 26, baseLabel: 'expedited hearings fully adjudicated', rows: [['Change of placement ordered', 8]], note: '8 of 26 fully adjudicated expedited hearings (30.77%) ordered a change of placement. This is not the total number of hearings or a measure of which party prevailed.' },
    ],
  },
];
