import { db } from '../storage'
import type { PillLog, UserSettings } from '../storage'
import { loadSettings, sanitizeSettings, saveSettings } from '../lib/settings'
import { LOGS_CHANGED_EVENT } from '../lib/reminders'
import { currentStreak, toDateKey } from '../lib/streak'

export const BACKUP_APP = 'allercat'
export const BACKUP_VERSION = '1.0'

export interface BackupPayload {
  app: typeof BACKUP_APP
  version: string
  exportedAt: string
  settings: UserSettings
  logs: PillLog[]
  /** Informational only: streaks are derived from the logs, so this is ignored on import. */
  streak: { current: number }
}

export type ImportMode = 'replace' | 'merge'

export interface ImportResult {
  logs: number
  skipped: number
}

export async function buildBackup(): Promise<BackupPayload> {
  const logs = await db.getAll('pillLogs')
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    settings: loadSettings(),
    logs,
    streak: { current: currentStreak(logs) },
  }
}

/** Collects pills, logs, streak and settings into a JSON file and triggers a browser download. */
export async function exportAllDataJSON(): Promise<string> {
  const json = JSON.stringify(await buildBackup(), null, 2)
  const filename = `allercat-backup-${toDateKey()}.json`
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return filename
}

const isLog = (l: unknown): l is PillLog => {
  if (!l || typeof l !== 'object') return false
  const x = l as Record<string, unknown>
  return (
    typeof x.id === 'string' &&
    x.id !== '' &&
    typeof x.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(x.date) &&
    typeof x.timestamp === 'number' &&
    typeof x.pillTaken === 'boolean' &&
    typeof x.hasSymptoms === 'boolean' &&
    Array.isArray(x.symptoms) &&
    x.symptoms.every((s) => typeof s === 'string') &&
    (x.pillId === undefined || typeof x.pillId === 'string') &&
    (x.notes === undefined || typeof x.notes === 'string')
  )
}

/** Parses and validates a backup file's contents. Throws an Error with a user-readable message. */
export function parseBackup(jsonString: string): { settings: UserSettings; logs: PillLog[]; skipped: number } {
  let data: unknown
  try {
    data = JSON.parse(jsonString)
  } catch {
    throw new Error('That file isn’t valid JSON.')
  }
  const b = data as Partial<BackupPayload> | null
  if (!b || typeof b !== 'object' || b.app !== BACKUP_APP) throw new Error('That isn’t an AllerCat backup file.')
  if (typeof b.version !== 'string' || parseInt(b.version, 10) > parseInt(BACKUP_VERSION, 10)) {
    throw new Error('This backup was made by a newer version of AllerCat.')
  }
  if (!Array.isArray(b.logs)) throw new Error('The backup is missing its logs.')
  if (!b.settings || typeof b.settings !== 'object') throw new Error('The backup is missing its settings.')

  const settings = sanitizeSettings(b.settings)
  const pillIds = new Set(settings.pills.map((p) => p.id))
  const valid = b.logs.filter(isLog).map((l) => ({ ...l, pillId: l.pillId || 'default' }))
  // Logs for pills that don't exist in the backup would never show in the app.
  const logs = valid.filter((l) => pillIds.has(l.pillId))
  return { settings, logs, skipped: b.logs.length - logs.length }
}

/**
 * Validates a backup, then restores it. Nothing is touched if validation fails.
 * `replace` swaps current logs and settings; `merge` adds imported logs (imported wins on the same day/pill)
 * and unions pills, keeping current settings otherwise.
 */
export async function importAllDataJSON(jsonString: string, mode: ImportMode = 'replace'): Promise<ImportResult> {
  const { settings, logs, skipped } = parseBackup(jsonString)

  if (mode === 'replace') {
    await db.clear('pillLogs')
    await Promise.all(logs.map((l) => db.put('pillLogs', l)))
    saveSettings(settings)
  } else {
    const current = loadSettings()
    const known = new Set(current.pills.map((p) => p.id))
    const pills = [...current.pills, ...settings.pills.filter((p) => !known.has(p.id))]
    await Promise.all(logs.map((l) => db.put('pillLogs', l)))
    saveSettings({ ...current, pills })
  }
  window.dispatchEvent(new Event(LOGS_CHANGED_EVENT))
  return { logs: logs.length, skipped }
}
