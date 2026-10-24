import { useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import Card from './Card'
import type { PillLog } from '../storage'
import { toDateKey } from '../lib/streak'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

type Status = 'clean' | 'symptoms' | 'missed' | 'future'

const DOT: Record<Status, string> = {
  clean: 'bg-emerald-400',
  symptoms: 'bg-amber-400',
  missed: 'bg-rose-200',
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

export default function LogCalendar({ logs }: { logs: PillLog[] }) {
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

  const selLog = selected ? byDate.get(selected) : undefined

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
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center"
          onClick={() => setSelected(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Details for ${selected}`}
            onClick={(e) => e.stopPropagation()}
            className="animate-rise-in w-full max-w-sm rounded-3xl bg-cream p-5 shadow-xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <h3 className="text-lg font-bold">
                {new Date(`${selected}T00:00`).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </h3>
              <button aria-label="Close" onClick={() => setSelected(null)} className="rounded-full p-1">
                <X size={20} />
              </button>
            </div>
            {selLog?.pillTaken ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-ink-soft">Status</dt>
                  <dd className="font-medium">Pill taken</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Logged at</dt>
                  <dd className="font-medium">{new Date(selLog.timestamp).toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-ink-soft">Symptoms</dt>
                  <dd className="font-medium">{selLog.hasSymptoms ? selLog.symptoms.join(', ') : 'None'}</dd>
                </div>
                {selLog.notes && (
                  <div>
                    <dt className="text-ink-soft">Notes</dt>
                    <dd className="font-medium">{selLog.notes}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-ink-soft">
                {selected > today ? 'This day hasn’t happened yet.' : 'No pill logged for this day.'}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  )
}
