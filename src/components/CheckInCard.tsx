import { useState } from 'react'
import { Check } from 'lucide-react'
import Card from './Card'
import { useStore } from '../hooks/useStore'
import { useSettings } from '../hooks/useSettings'
import { currentStreak, logId, logsForPill, toDateKey } from '../lib/streak'
import { playCatSound } from '../utils/catSounds'
import { SYMPTOM_OPTIONS } from '../storage'
import type { PillItem } from '../storage'

const NO_SYMPTOMS = 'No symptoms'

const chip = (on: boolean) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-95 ${
    on ? 'bg-ink text-cream' : 'bg-white text-ink'
  }`

function CatGuide({ message }: { message: string }) {
  return <p className="w-fit rounded-2xl rounded-bl-sm bg-white/70 px-3 py-2 text-sm">{message}</p>
}

export function PillBadge({ pill }: { pill: PillItem }) {
  return (
    <span
      aria-hidden
      className="inline-block h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-white"
      style={{ backgroundColor: pill.color }}
    />
  )
}

const streakText = (n: number) => (n > 0 ? `🔥 ${n} day streak` : 'No streak yet')

export default function CheckInCard() {
  const { items, loading, save } = useStore('pillLogs')
  const { settings } = useSettings()
  const pills = settings.pills
  const multi = pills.length > 1
  const today = toDateKey()

  const [activeId, setActiveId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [notes, setNotes] = useState('')
  const [nudge, setNudge] = useState(false)
  const [saving, setSaving] = useState(false)

  const rows = pills.map((pill) => {
    const logs = logsForPill(items, pill.id)
    return { pill, todayLog: logs.find((l) => l.date === today && l.pillTaken), streak: currentStreak(logs) }
  })
  const pending = rows.filter((r) => !r.todayLog)
  const active = pills.find((p) => p.id === activeId)

  const toggle = (s: string) =>
    setSelected((prev) => {
      if (s === NO_SYMPTOMS) return prev.includes(s) ? [] : [s]
      const without = prev.filter((x) => x !== NO_SYMPTOMS && x !== s)
      return prev.includes(s) ? without : [...without, s]
    })

  const close = () => {
    setActiveId(null)
    setSelected([])
    setNotes('')
  }

  const submit = async () => {
    if (!active) return
    setSaving(true)
    const symptoms = selected.filter((s) => s !== NO_SYMPTOMS)
    try {
      await save({
        id: logId(today, active.id),
        date: today,
        pillId: active.id,
        timestamp: Date.now(),
        pillTaken: true,
        hasSymptoms: symptoms.length > 0,
        symptoms,
        notes: notes.trim() || undefined,
      })
      close()
      if (settings.soundEnabled) playCatSound(settings.catBreed, 'happy')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  const heading = multi
    ? pending.length === pills.length
      ? 'Time for your daily check-in!'
      : 'Nice! Any more pills today?'
    : 'Time for your daily check-in!'

  return (
    <Card tone="peach">
      {!multi && (
        <p className="mb-4 text-sm font-semibold" aria-live="polite">
          {rows[0].streak > 0 ? `🔥 ${rows[0].streak} Day Streak!` : 'Take today’s pill to start a streak'}
        </p>
      )}

      {active ? (
        <div key={`symptoms-${active.id}`} className="animate-rise-in space-y-4">
          <CatGuide message={multi ? `Great job! Any symptoms from ${active.name}?` : 'Great job! Any symptoms today?'} />
          <div className="flex flex-wrap gap-2" role="group" aria-label="Symptoms">
            {[...SYMPTOM_OPTIONS, NO_SYMPTOMS].map((s) => (
              <button key={s} aria-pressed={selected.includes(s)} onClick={() => toggle(s)} className={chip(selected.includes(s))}>
                {s}
              </button>
            ))}
          </div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
            className="w-full resize-none rounded-2xl bg-white px-4 py-3 text-base outline-none placeholder:text-ink-soft/60 focus:ring-2 focus:ring-blush"
          />
          <div className="flex gap-3">
            <button onClick={close} className="rounded-2xl bg-white px-5 py-3 font-semibold">
              Back
            </button>
            <button
              onClick={submit}
              disabled={selected.length === 0 || saving}
              className="flex-1 rounded-2xl bg-ink py-3 font-bold text-cream transition-transform active:scale-95 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      ) : multi ? (
        <div key="list" className="animate-rise-in space-y-4">
          <CatGuide message={pending.length === 0 ? 'Purr-fect! All done for today.' : nudge ? 'No rush — tap each pill once you’ve taken it.' : heading} />
          <ul className="space-y-2">
            {rows.map(({ pill, todayLog, streak }) => (
              <li key={pill.id} className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3">
                <PillBadge pill={pill} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{pill.name}</p>
                  <p className="truncate text-xs text-ink-soft">
                    {todayLog
                      ? `Taken · ${todayLog.hasSymptoms ? todayLog.symptoms.join(', ') : 'no symptoms'}`
                      : streakText(streak)}
                  </p>
                  {todayLog && <p className="text-xs text-ink-soft">{streakText(streak)}</p>}
                </div>
                {todayLog ? (
                  <Check size={20} aria-label="Taken" />
                ) : (
                  <button
                    onClick={() => setActiveId(pill.id)}
                    aria-label={`Log ${pill.name}`}
                    className="rounded-xl bg-ink px-4 py-2 text-sm font-bold text-cream transition-transform active:scale-95"
                  >
                    Taken
                  </button>
                )}
              </li>
            ))}
          </ul>
          {pending.length > 0 && !nudge && (
            <button onClick={() => setNudge(true)} className="text-sm font-semibold underline">
              Not yet
            </button>
          )}
        </div>
      ) : rows[0].todayLog ? (
        <div key="done" className="animate-rise-in space-y-3">
          <CatGuide message="Purr-fect! All done for today." />
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Check size={16} /> Pill taken · {rows[0].todayLog.hasSymptoms ? rows[0].todayLog.symptoms.join(', ') : 'no symptoms'}
          </p>
        </div>
      ) : (
        <div key="ask" className="animate-rise-in space-y-4">
          <CatGuide message={nudge ? 'No rush — tap Yes once you’ve taken it.' : 'Time for your daily check-in!'} />
          <h2 className="text-xl font-bold leading-snug">Did you take your immunotherapy pill today?</h2>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setActiveId(pills[0].id)}
              className="rounded-2xl bg-ink py-4 text-lg font-bold text-cream transition-transform active:scale-95"
            >
              Yes
            </button>
            <button
              onClick={() => setNudge(true)}
              className="rounded-2xl bg-white py-4 text-lg font-bold transition-transform active:scale-95"
            >
              Not Yet
            </button>
          </div>
        </div>
      )}
    </Card>
  )
}
