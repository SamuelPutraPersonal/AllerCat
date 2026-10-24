import { Home, ClipboardList, Settings } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type TabId = 'home' | 'log' | 'settings'

const TABS: { id: TabId; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'log', label: 'Log', icon: ClipboardList },
  { id: 'settings', label: 'Settings', icon: Settings },
]

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
}

export default function BottomNav({ active, onChange }: Props) {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-ink/5 bg-white/80 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md justify-around px-2 pt-2 pb-1">
        {TABS.map(({ id, label, icon: Icon }) => {
          const isActive = id === active
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange(id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-0.5 rounded-2xl py-1.5 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-ink' : 'text-ink-soft'
                }`}
              >
                <span
                  className={`flex h-8 w-14 items-center justify-center rounded-full transition-colors ${
                    isActive ? 'bg-peach' : ''
                  }`}
                >
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} />
                </span>
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
