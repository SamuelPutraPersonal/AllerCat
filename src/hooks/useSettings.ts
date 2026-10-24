import { useEffect, useState } from 'react'
import type { UserSettings } from '../storage'
import { loadSettings, saveSettings } from '../lib/settings'

export function useSettings() {
  const [settings, setSettings] = useState<UserSettings>(loadSettings)

  useEffect(() => {
    const sync = () => setSettings(loadSettings())
    window.addEventListener('allercat:settings', sync)
    return () => window.removeEventListener('allercat:settings', sync)
  }, [])

  const update = (patch: Partial<UserSettings>) => saveSettings({ ...settings, ...patch })
  return { settings, update }
}
