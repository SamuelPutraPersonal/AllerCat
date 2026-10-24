import { useCallback, useEffect, useState } from 'react'
import { db } from '../storage'
import type { UserSettings } from '../storage'
import {
  LOGS_CHANGED_EVENT,
  MORNING_NOTIFICATION,
  scheduleDaily,
  scheduleEveningLoop,
  showNotification,
} from '../lib/reminders'
import { allTaken } from '../lib/streak'

/**
 * Runs the morning reminder and the evening snooze loop while the app is open.
 * `nagging` is true whenever the cat should ask again; `snooze` hides it until
 * the next 5-minute check. Reminders stay quiet once every pill is logged.
 */
export function useReminders(settings: UserSettings) {
  const { morningReminderEnabled, morningReminderTime, eveningReminderEnabled, eveningReminderTime } = settings
  const pillKey = settings.pills.map((p) => p.id).join(',')
  const [looping, setLooping] = useState(false)
  const [snoozed, setSnoozed] = useState(false)

  useEffect(() => {
    if (!morningReminderEnabled) return
    const pillTakenToday = async () => allTaken(await db.getAll('pillLogs'), pillKey.split(','))
    return scheduleDaily(morningReminderTime, async () => {
      if (!(await pillTakenToday())) await showNotification(MORNING_NOTIFICATION)
    })
  }, [morningReminderEnabled, morningReminderTime, pillKey])

  useEffect(() => {
    if (!eveningReminderEnabled) {
      setLooping(false)
      return
    }
    const pillTakenToday = async () => allTaken(await db.getAll('pillLogs'), pillKey.split(','))
    const stop = scheduleEveningLoop(eveningReminderTime, pillTakenToday, (active) => {
      setLooping(active)
      if (active) setSnoozed(false) // each 5-minute check brings the prompt back
    })
    // Logging the pill ends the loop immediately.
    const recheck = async () => (await pillTakenToday()) && setLooping(false)
    window.addEventListener(LOGS_CHANGED_EVENT, recheck)
    return () => {
      stop()
      window.removeEventListener(LOGS_CHANGED_EVENT, recheck)
    }
  }, [eveningReminderEnabled, eveningReminderTime, pillKey])

  const snooze = useCallback(() => setSnoozed(true), [])
  return { nagging: looping && !snoozed, snooze }
}
