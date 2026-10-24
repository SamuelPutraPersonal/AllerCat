import type { PillLog } from '../storage'

export function toDateKey(d: Date = new Date()): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/** One check-in per pill per day. */
export const logId = (date: string, pillId: string) => `${date}:${pillId}`

export const logsForPill = (logs: PillLog[], pillId: string) => logs.filter((l) => l.pillId === pillId)

/** True when every pill in `pillIds` has a taken log on `date`. */
export function allTaken(logs: PillLog[], pillIds: string[], date: string = toDateKey()): boolean {
  const taken = new Set(logs.filter((l) => l.date === date && l.pillTaken).map((l) => l.pillId))
  return pillIds.every((id) => taken.has(id))
}

/**
 * Consecutive days with a pill taken, ending today. If today isn't logged yet
 * the streak is still alive and counts back from yesterday. Pass one pill's logs.
 */
export function currentStreak(logs: PillLog[]): number {
  const taken = new Set(logs.filter((l) => l.pillTaken).map((l) => l.date))
  const day = new Date()
  if (!taken.has(toDateKey(day))) day.setDate(day.getDate() - 1)
  let streak = 0
  while (taken.has(toDateKey(day))) {
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}
