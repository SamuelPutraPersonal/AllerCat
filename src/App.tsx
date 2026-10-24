import { useState } from 'react'
import { useSettings } from './hooks/useSettings'
import { useReminders } from './hooks/useReminders'
import AppShell from './components/AppShell'
import SnoozePrompt from './components/SnoozePrompt'
import type { TabId } from './components/BottomNav'
import HomePage from './pages/HomePage'
import LogPage from './pages/LogPage'
import SettingsPage from './pages/SettingsPage'

const PAGES: Record<TabId, () => React.JSX.Element> = {
  home: HomePage,
  log: LogPage,
  settings: SettingsPage,
}

export default function App() {
  const [tab, setTab] = useState<TabId>('home')
  const Page = PAGES[tab]
  const { settings } = useSettings()
  const { nagging, snooze } = useReminders(settings)
  return (
    <AppShell active={tab} onChange={setTab}>
      <Page />
      {nagging && (
        <SnoozePrompt
          onTaken={() => {
            snooze()
            setTab('home')
          }}
          onNotYet={snooze}
        />
      )}
    </AppShell>
  )
}
