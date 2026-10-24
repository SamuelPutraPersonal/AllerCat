import type { ReactNode } from 'react'
import { WifiOff } from 'lucide-react'
import BottomNav from './BottomNav'
import type { TabId } from './BottomNav'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

interface Props {
  active: TabId
  onChange: (tab: TabId) => void
  children: ReactNode
}

export default function AppShell({ active, onChange, children }: Props) {
  const online = useOnlineStatus()
  return (
    <div className="mx-auto flex h-full max-w-md flex-col bg-cream">
      {!online && (
        <div className="flex items-center justify-center gap-1.5 bg-lavender px-3 pb-1.5 pt-[calc(env(safe-area-inset-top)+0.375rem)] text-xs font-medium">
          <WifiOff size={14} /> Offline — changes are saved on this device
        </div>
      )}
      <main className="flex-1 overflow-y-auto px-5 pt-[calc(env(safe-area-inset-top)+1.25rem)] pb-28">
        {children}
      </main>
      <BottomNav active={active} onChange={onChange} />
    </div>
  )
}
