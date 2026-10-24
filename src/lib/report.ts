import type { PillLog } from '../storage'
import { toDateKey } from './streak'

const RULE = '----------------------------------------'

/** `logs` must belong to a single pill; `pillName` is shown in the header. */
export function buildReport(logs: PillLog[], days = 30, pillName?: string): string {
  const byDate = new Map(logs.map((l) => [l.date, l]))
  const day = new Date()
  const entries: string[] = []
  let taken = 0
  for (let i = 0; i < days; i++) {
    const key = toDateKey(day)
    const log = byDate.get(key)
    if (log?.pillTaken) {
      taken++
      const symptoms = log.hasSymptoms ? log.symptoms.join(', ') : 'None'
      entries.push(`- ${key}: Taken | Symptoms: ${symptoms}${log.notes ? ` | Notes: ${log.notes}` : ''}`)
    } else {
      entries.push(`- ${key}: Missed / not logged`)
    }
    day.setDate(day.getDate() - 1)
  }
  return [
    RULE,
    'Allergy Immunotherapy Daily Log',
    ...(pillName ? [`Pill: ${pillName}`] : []),
    `Period: Last ${days} Days`,
    `Total Days Taken: ${taken}/${days}`,
    '',
    'Detailed Entries:',
    ...entries,
    RULE,
  ].join('\n')
}
