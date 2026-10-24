const MAX_DELAY = 2 ** 31 - 1

export const SNOOZE_MS = 5 * 60 * 1000
export const LOGS_CHANGED_EVENT = 'allercat:logs'

export const MORNING_NOTIFICATION = {
  title: 'Good morning! 🐱',
  body: 'Good morning! Don’t forget to take your immunotherapy pill today 🐱',
  tag: 'morning-reminder',
}
export const EVENING_NOTIFICATION = {
  title: 'Pill time 💊',
  body: 'Hey! Please take your pill 💊',
  tag: 'evening-reminder',
}

export const TEST_NOTIFICATION = {
  title: 'AllerCat 🐱',
  body: '🐱 AllerCat Test: Meow! Notifications are working perfectly!',
  tag: 'test-notification',
}

/** Asks for permission if needed, then fires an immediate local test notification. */
export async function triggerTestNotification(): Promise<NotificationPermission> {
  const permission = await requestPermission()
  if (permission === 'granted') await showNotification(TEST_NOTIFICATION)
  return permission
}

/** Next occurrence of "HH:mm" strictly after `from`. */
export function nextReminderAt(time: string, from = new Date()): Date {
  const next = todayAt(time, from)
  if (next <= from) next.setDate(next.getDate() + 1)
  return next
}

/** "HH:mm" on the same calendar day as `day`. */
export function todayAt(time: string, day = new Date()): Date {
  const [h, m] = time.split(':').map(Number)
  const at = new Date(day)
  at.setHours(h, m, 0, 0)
  return at
}

export const notificationsSupported = () => typeof Notification !== 'undefined'

export async function requestPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return 'denied'
  return Notification.permission === 'default' ? Notification.requestPermission() : Notification.permission
}

export async function showNotification({ title, body, tag }: { title: string; body: string; tag: string }) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  const options: NotificationOptions & { renotify?: boolean } = {
    body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag,
    renotify: true,
  }
  const reg = await navigator.serviceWorker?.getRegistration()
  if (reg) await reg.showNotification(title, options)
  else new Notification(title, options)
}

/**
 * Fires `fire` once a day at "HH:mm". Browsers have no reliable background
 * scheduler without a push server, so this fires while the app is running
 * and re-arms when it returns to the foreground.
 */
export function scheduleDaily(time: string, fire: () => Promise<void> | void): () => void {
  let timer: number | undefined
  const arm = () => {
    window.clearTimeout(timer)
    const delay = Math.min(nextReminderAt(time).getTime() - Date.now(), MAX_DELAY)
    timer = window.setTimeout(async () => {
      try {
        await fire()
      } finally {
        arm()
      }
    }, delay)
  }
  arm()

  // Timers are throttled in background tabs; re-arm on return.
  const onVisible = () => document.visibilityState === 'visible' && arm()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }
}

/**
 * Evening reminder + snooze loop. From `time` onward, while today's pill isn't
 * logged, notify and call `onNag(true)`, then repeat every `SNOOZE_MS`. The loop
 * stops once the pill is logged and rests until the next evening. Opening the
 * app after `time` resumes the loop straight away.
 */
export function scheduleEveningLoop(
  time: string,
  isTaken: () => Promise<boolean>,
  onNag: (active: boolean) => void,
): () => void {
  let timer: number | undefined
  let stopped = false

  const waitForEvening = () => {
    onNag(false)
    const delay = Math.min(nextReminderAt(time).getTime() - Date.now(), MAX_DELAY)
    timer = window.setTimeout(nag, delay)
  }

  const nag = async () => {
    if (stopped) return
    // Past midnight the new day hasn't reached its evening yet.
    if (new Date() < todayAt(time) || (await isTaken())) {
      if (!stopped) waitForEvening()
      return
    }
    if (stopped) return
    onNag(true)
    // The in-app prompt already covers a visible app; only ping when it's in the background.
    if (document.visibilityState !== 'visible') await showNotification(EVENING_NOTIFICATION).catch(() => {})
    if (!stopped) timer = window.setTimeout(nag, SNOOZE_MS)
  }

  const start = () => {
    window.clearTimeout(timer)
    if (new Date() >= todayAt(time)) nag()
    else waitForEvening()
  }
  start()

  const onVisible = () => document.visibilityState === 'visible' && start()
  document.addEventListener('visibilitychange', onVisible)
  return () => {
    stopped = true
    window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', onVisible)
  }
}
