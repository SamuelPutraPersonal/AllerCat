import { CAT_BREEDS, DEFAULT_PILL_ID, PILL_COLORS } from '../storage'
import type { CatBreed, PillItem, UserSettings } from '../storage'

const KEY = 'allercat:settings'

export const DEFAULT_PILLS: PillItem[] = [{ id: DEFAULT_PILL_ID, name: 'Immunotherapy pill', color: PILL_COLORS[0] }]

export const DEFAULT_SETTINGS: UserSettings = {
  morningReminderTime: '09:00',
  morningReminderEnabled: false,
  eveningReminderTime: '19:00',
  eveningReminderEnabled: false,
  catBreed: 'three-color',
  soundEnabled: true,
  pills: DEFAULT_PILLS,
}

const validTime = (value: unknown, fallback: string) =>
  typeof value === 'string' && /^\d{2}:\d{2}$/.test(value) ? value : fallback

const validBreed = (value: unknown): CatBreed =>
  CAT_BREEDS.includes(value as CatBreed) ? (value as CatBreed) : DEFAULT_SETTINGS.catBreed

function validPills(value: unknown): PillItem[] {
  if (!Array.isArray(value)) return DEFAULT_PILLS
  const pills = value.filter(
    (p): p is PillItem =>
      !!p && typeof p.id === 'string' && p.id !== '' && typeof p.name === 'string' && typeof p.color === 'string',
  )
  return pills.length ? pills : DEFAULT_PILLS
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return DEFAULT_SETTINGS
    // `reminderTime` / `reminderEnabled` are the single-reminder keys from earlier versions.
    const parsed = JSON.parse(raw) as Partial<UserSettings> & { reminderTime?: string; reminderEnabled?: boolean }
    return {
      morningReminderTime: validTime(parsed.morningReminderTime ?? parsed.reminderTime, DEFAULT_SETTINGS.morningReminderTime),
      morningReminderEnabled: (parsed.morningReminderEnabled ?? parsed.reminderEnabled) === true,
      eveningReminderTime: validTime(parsed.eveningReminderTime, DEFAULT_SETTINGS.eveningReminderTime),
      eveningReminderEnabled: parsed.eveningReminderEnabled === true,
      catBreed: validBreed(parsed.catBreed),
      soundEnabled: parsed.soundEnabled !== false,
      pills: validPills(parsed.pills),
    }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function saveSettings(settings: UserSettings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    // storage unavailable (private mode / quota) — settings just won't persist
  }
  window.dispatchEvent(new Event('allercat:settings'))
}
