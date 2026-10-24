import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Card from './Card'
import LogEntryModal from './LogEntryModal'
import type { PillItem, PillLog } from '../storage'
import { toDateKey } from '../lib/streak'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

type Status = 'clean' | 'symptoms' | 'missed' | 'future'

const DOT: Record<Status, string> = {
  clean: 'bg-emerald-400',
  symptoms: 'bg-amber-400',
  missed: 'bg-gray-400',
  future: 'bg-transparent',
}

function statusOf(log: PillLog | undefined, key: string, today: string): Status {
  if (log?.pillTaken) return log.hasSymptoms ? 'symptoms' : 'clean'
  return key > today ? 'future' : 'missed'
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
      {label}
    </span>
  )
}

interface Props {
  /** Logs for the selected pill only. */
  logs: PillLog[]
  pill: PillItem
  onSave: (log: PillLog) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export default function LogCalendar({ logs, pill, onSave, onDelete }: Props) {
  const today = toDateKey()
  const [cursor, setCursor] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1)
  })
  const [selected, setSelected] = useState<string | null>(null)

  const byDate = new Map(logs.map((l) => [l.date, l]))
  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const leading = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array<null>(leading).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  const keyFor = (day: number) => toDateKey(new Date(year, month, day))
  const shift = (n: number) => setCursor(new Date(year, month + n, 1))

  return (
    <>
      <Card tone="white">
        <div className="mb-3 flex items-center justify-between">
          <button aria-label="Previous month" onClick={() => shift(-1)} className="rounded-full p-2 active:scale-90">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-semibold">{cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          <button aria-label="Next month" onClick={() => shift(1)} className="rounded-full p-2 active:scale-90">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-y-1 text-center text-xs text-ink-soft">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="pb-1">{d}</span>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <span key={`b${i}`} />
            const key = keyFor(day)
            const status = statusOf(byDate.get(key), key, today)
            return (
              <button
                key={key}
                onClick={() => setSelected(key)}
                aria-label={`${key}, ${status === 'clean' ? 'pill taken' : status === 'symptoms' ? 'pill taken with symptoms' : status === 'missed' ? 'missed' : 'upcoming'}`}
                className={`mx-auto flex h-11 w-11 flex-col items-center justify-center gap-0.5 rounded-2xl text-sm text-ink transition-transform active:scale-90 ${
                  key === today ? 'ring-2 ring-blush' : ''
                }`}
              >
                {day}
                <span className={`h-2 w-2 rounded-full ${DOT[status]}`} />
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
          <Legend dot={DOT.clean} label="Taken" />
          <Legend dot={DOT.symptoms} label="Taken + symptoms" />
          <Legend dot={DOT.missed} label="Missed" />
        </div>
      </Card>

      {selected && (
        <LogEntryModal
          // Remount per day/pill so the form re-seeds from that entry.
          key={`${selected}:${pill.id}`}
          date={selected}
          pillId={pill.id}
          pillName={pill.name}
          existing={byDate.get(selected)}
          future={selected > today}
          onSave={onSave}
          onDelete={onDelete}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}
