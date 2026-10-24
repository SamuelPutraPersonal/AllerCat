import type { PillLog } from '../storage'
import { currentStreak, toDateKey } from '../lib/streak'

export interface Adherence {
  taken: number
  missed: number
  /** Days counted: today only counts once its pill is taken. */
  total: number
  /** 0–100, or null when no day has been counted yet. */
  percent: number | null
}

export interface SymptomCount {
  symptom: string
  count: number
}

export interface Recap {
  week: Adherence
  month: Adherence
  symptoms: SymptomCount[]
  /** Days with at least one symptom in the last 30 days. */
  symptomDays: number
  streak: number
  hasLogs: boolean
}

function adherenceSince(logs: PillLog[], start: Date, today: Date): Adherence {
  const taken = new Set(logs.filter((l) => l.pillTaken).map((l) => l.date))
  let takenDays = 0
  let total = 0
  for (const day = new Date(start); day <= today; day.setDate(day.getDate() + 1)) {
    const key = toDateKey(day)
    if (taken.has(key)) {
      takenDays++
      total++
    } else if (key !== toDateKey(today)) {
      total++ // today isn't missed until it's over
    }
  }
  return { taken: takenDays, missed: total - takenDays, total, percent: total ? Math.round((takenDays / total) * 100) : null }
}

/** Adherence for Monday through today. */
export function weekAdherence(logs: PillLog[], today = new Date()): Adherence {
  const start = new Date(today)
  start.setDate(today.getDate() - ((today.getDay() + 6) % 7))
  return adherenceSince(logs, start, today)
}

/** Adherence for the 1st of the month through today. */
export function monthAdherence(logs: PillLog[], today = new Date()): Adherence {
  return adherenceSince(logs, new Date(today.getFullYear(), today.getMonth(), 1), today)
}

/** Symptom frequency (days reported) over the last `days` days, most frequent first. */
export function symptomFrequency(logs: PillLog[], days = 30, today = new Date()): { counts: SymptomCount[]; symptomDays: number } {
  const start = new Date(today)
  start.setDate(today.getDate() - (days - 1))
  const from = toDateKey(start)
  const counts = new Map<string, number>()
  let symptomDays = 0
  for (const l of logs) {
    if (l.date < from || l.date > toDateKey(today) || !l.pillTaken || l.symptoms.length === 0) continue
    symptomDays++
    for (const s of new Set(l.symptoms)) counts.set(s, (counts.get(s) ?? 0) + 1)
  }
  const sorted = [...counts].map(([symptom, count]) => ({ symptom, count })).sort((a, b) => b.count - a.count || a.symptom.localeCompare(b.symptom))
  return { counts: sorted, symptomDays }
}

export function buildRecap(logs: PillLog[], today = new Date()): Recap {
  const { counts, symptomDays } = symptomFrequency(logs, 30, today)
  return {
    week: weekAdherence(logs, today),
    month: monthAdherence(logs, today),
    symptoms: counts,
    symptomDays,
    streak: currentStreak(logs),
    hasLogs: logs.some((l) => l.pillTaken),
  }
}

export interface CatComment {
  emoji: string
  text: string
}

export function catCommentary(r: Recap): CatComment {
  if (!r.hasLogs) return { emoji: '🐱', text: 'Log your first pill and I’ll start tracking your progress!' }
  if (r.symptomDays >= 8) {
    return { emoji: '🫶', text: 'Symptoms have been frequent lately. Be gentle with yourself — and tell your doctor about it. I’m right here.' }
  }
  if (r.streak >= 7) return { emoji: '🎉', text: `${r.streak} days in a row! You’re a purr-fect superstar!` }
  if ((r.week.percent ?? 0) >= 90 && r.week.total >= 3) return { emoji: '😻', text: 'Amazing week! Keep up the great routine.' }
  if (r.month.percent !== null && r.month.percent < 50) {
    return { emoji: '🐾', text: 'Every day is a fresh start. Let’s take it one pill at a time together!' }
  }
  if (r.symptomDays > 0) return { emoji: '💜', text: 'A few symptoms popped up, but you’re doing the work. Proud of you!' }
  return { emoji: '😸', text: 'Nice and steady! Every pill counts.' }
}
