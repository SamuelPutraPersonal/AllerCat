import { useState } from 'react'
import { X } from 'lucide-react'
import { SYMPTOM_OPTIONS } from '../storage'
import type { PillLog } from '../storage'
import { logId } from '../lib/streak'

interface Props {
  /** Local calendar day, YYYY-MM-DD. */
  date: string
  pillId: string
  pillName: string
  existing?: PillLog
  /** The day hasn't happened yet, so a new check-in can't be recorded. */
  future: boolean
  onSave: (log: PillLog) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
}

export default function LogEntryModal({ date, pillId, pillName, existing, future, onSave, onDelete, onClose }: Props) {
  const [taken, setTaken] = useState(existing?.pillTaken ?? true)
  const [symptoms, setSymptoms] = useState<string[]>(existing?.symptoms ?? [])
  const [notes, setNotes] = useState(existing?.notes ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const heading = new Date(`${date}T00:00`).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const canEdit = !future || !!existing

  const toggleSymptom = (s: string) =>
    setSymptoms((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      onClose()
    } catch {
      setError('Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  const save = () => {
    const kept = taken ? symptoms : []
    const trimmed = notes.trim()
    const log: PillLog = {
      id: logId(date, pillId),
      date,
      pillId,
      // Backfilled entries are stamped at noon of the chosen day; edits keep the original time.
      timestamp: existing?.timestamp ?? new Date(`${date}T12:00`).getTime(),
      pillTaken: taken,
      hasSymptoms: kept.length > 0,
      symptoms: kept,
      ...(trimmed ? { notes: trimmed } : {}),
    }
    return run(() => onSave(log))
  }

  const remove = () => {
    if (!existing || !window.confirm('Delete this entry?')) return
    return run(() => onDelete(existing.id))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Manage Log for ${heading}`}
        onClick={(e) => e.stopPropagation()}
        className="animate-rise-in max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl bg-cream p-5 shadow-xl"
      >
        <div className="mb-3 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold">Manage Log for {heading}</h3>
            <p className="text-sm text-ink-soft">{pillName}</p>
          </div>
          <button aria-label="Close" onClick={onClose} className="rounded-full p-1">
            <X size={20} />
          </button>
        </div>

        {!canEdit ? (
          <p className="text-sm text-ink-soft">This day hasn’t happened yet, so there’s nothing to log.</p>
        ) : (
          <div className="space-y-4">
            <div role="radiogroup" aria-label="Pill status" className="grid grid-cols-2 gap-2">
              {[
                { value: true, label: 'Taken' },
                { value: false, label: 'Missed' },
              ].map((o) => (
                <button
                  key={o.label}
                  role="radio"
                  aria-checked={taken === o.value}
                  onClick={() => setTaken(o.value)}
                  className={`rounded-xl px-4 py-3 text-sm font-semibold transition-transform active:scale-95 ${
                    taken === o.value ? 'bg-ink text-cream' : 'bg-white'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            <fieldset disabled={!taken} className={taken ? '' : 'opacity-40'}>
              <legend className="mb-2 text-sm font-semibold">Symptoms</legend>
              <div className="flex flex-wrap gap-2">
                {SYMPTOM_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={symptoms.includes(s)}
                    onClick={() => toggleSymptom(s)}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                      symptoms.includes(s) ? 'bg-amber-400 text-ink' : 'bg-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {!taken && <p className="mt-1 text-xs">Symptoms are tracked on days the pill is taken.</p>}
            </fieldset>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold">Notes (optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                className="w-full rounded-xl bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blush"
              />
            </label>

            {error && (
              <p role="alert" className="text-sm font-medium">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={save}
                disabled={busy}
                className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-cream disabled:opacity-40"
              >
                {existing ? 'Save Changes' : 'Save Entry'}
              </button>
              {existing && (
                <button onClick={remove} disabled={busy} className="rounded-xl bg-peach px-4 py-3 text-sm font-semibold disabled:opacity-40">
                  Delete Entry
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
