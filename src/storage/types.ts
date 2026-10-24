export const SYMPTOM_OPTIONS = [
  'Mouth/Throat Itch',
  'Swallowing Issues',
  'Sneezing/Runny Nose',
  'Fatigue',
] as const

export const CAT_BREEDS = ['three-color', 'orange', 'black', 'ragdoll', 'maine-coon'] as const
export type CatBreed = (typeof CAT_BREEDS)[number]

/** Badge colors a pill can use (hex). */
export const PILL_COLORS = ['#f7b8c4', '#fdd9c4', '#cfeadd', '#d3e6f7', '#dcd3f5', '#f6e2a0'] as const

export interface PillItem {
  id: string
  name: string
  /** Badge color, hex like "#f7b8c4". */
  color: string
}

/** Id given to logs saved before multiple pills existed, and to the starter pill. */
export const DEFAULT_PILL_ID = 'default'

export interface PillLog {
  /** `${date}:${pillId}` — one check-in per pill per day. */
  id: string
  /** Local calendar day, YYYY-MM-DD. */
  date: string
  pillId: string
  timestamp: number
  pillTaken: boolean
  hasSymptoms: boolean
  symptoms: string[]
  notes?: string
}

export interface UserSettings {
  /** 24h "HH:mm", e.g. "09:00". */
  morningReminderTime: string
  morningReminderEnabled: boolean
  /** 24h "HH:mm", e.g. "19:00". Starts the 5-minute snooze loop until every pill is logged. */
  eveningReminderTime: string
  eveningReminderEnabled: boolean
  catBreed: CatBreed
  /** Cat meows/purrs on tap and on check-in. */
  soundEnabled: boolean
  /** Active pills; always has at least one. */
  pills: PillItem[]
}

export interface StoreMap {
  pillLogs: PillLog
}

export type StoreName = keyof StoreMap
