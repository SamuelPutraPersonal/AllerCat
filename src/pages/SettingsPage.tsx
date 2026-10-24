import { useState } from 'react'
import { Info, Pencil, Trash2 } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import { BREED_LABELS, CatAvatar } from '../components/CatCompanion'
import { useSettings } from '../hooks/useSettings'
import {
  LOGS_CHANGED_EVENT,
  notificationsSupported,
  requestPermission,
  triggerTestNotification,
} from '../lib/reminders'
import { CAT_BREEDS, PILL_COLORS, db } from '../storage'
import type { CatBreed, PillItem, UserSettings } from '../storage'
import { DEFAULT_SETTINGS, saveSettings } from '../lib/settings'
import { toDateKey } from '../lib/streak'

interface ReminderCardProps {
  tone: 'lavender' | 'peach'
  label: string
  description: string
  enabled: boolean
  time: string
  timeLabel: string
  onToggle: () => void
  onTime: (time: string) => void
  onTest: () => void
}

function ReminderCard({ tone, label, description, enabled, time, timeLabel, onToggle, onTime, onTest }: ReminderCardProps) {
  return (
    <Card tone={tone}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">{label}</p>
          <p className="text-sm">{description}</p>
        </div>
        <button
          role="switch"
          aria-checked={enabled}
          aria-label={label}
          onClick={onToggle}
          className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${enabled ? 'bg-ink' : 'bg-white'}`}
        >
          <span
            className={`absolute left-1 top-1 h-6 w-6 rounded-full shadow transition-transform ${
              enabled ? 'translate-x-6 bg-cream' : 'bg-ink/40'
            }`}
          />
        </button>
      </div>

      <label className="mt-4 flex items-center justify-between gap-4">
        <span className="text-sm font-medium">{timeLabel}</span>
        <input
          type="time"
          value={time}
          onChange={(e) => e.target.value && onTime(e.target.value)}
          className="rounded-xl bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blush"
        />
      </label>

      <button
        onClick={onTest}
        className="mt-4 w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold transition-transform active:scale-95"
      >
        Send Test Notification Now
      </button>
    </Card>
  )
}

function CatPicker({ value, onChange }: { value: CatBreed; onChange: (b: CatBreed) => void }) {
  return (
    <Card tone="white">
      <p className="font-semibold">Choose Your Cat Companion</p>
      <div role="radiogroup" aria-label="Cat companion" className="mt-3 grid grid-cols-3 gap-2">
        {CAT_BREEDS.map((b) => (
          <button
            key={b}
            role="radio"
            aria-checked={value === b}
            onClick={() => onChange(b)}
            className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-xs font-semibold transition-all active:scale-95 ${
              value === b ? 'bg-ink text-cream' : 'bg-cream'
            }`}
          >
            <CatAvatar breed={b} />
            {BREED_LABELS[b]}
          </button>
        ))}
      </div>
    </Card>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <div role="radiogroup" aria-label="Pill color" className="flex flex-wrap gap-2">
      {PILL_COLORS.map((c) => (
        <button
          key={c}
          role="radio"
          aria-checked={value === c}
          aria-label={`Color ${c}`}
          onClick={() => onChange(c)}
          className={`h-8 w-8 rounded-full transition-transform active:scale-90 ${value === c ? 'ring-2 ring-ink ring-offset-2' : ''}`}
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

interface PillFormProps {
  initial: PillItem
  submitLabel: string
  onSubmit: (pill: PillItem) => void
  onCancel?: () => void
}

function PillForm({ initial, submitLabel, onSubmit, onCancel }: PillFormProps) {
  const [name, setName] = useState(initial.name)
  const [color, setColor] = useState(initial.color)
  const trimmed = name.trim()
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        if (!trimmed) return
        onSubmit({ ...initial, name: trimmed, color })
        if (!onCancel) setName('')
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Pill name"
        aria-label="Pill name"
        maxLength={40}
        className="w-full rounded-xl bg-white px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blush"
      />
      <ColorPicker value={color} onChange={setColor} />
      <div className="flex gap-2">
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold">
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!trimmed}
          className="flex-1 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-cream disabled:opacity-40"
        >
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

const newPillId = () => globalThis.crypto?.randomUUID?.() ?? `pill-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`

function PillManager({ pills, onChange, onDeleted }: { pills: PillItem[]; onChange: (p: PillItem[]) => void; onDeleted: (p: PillItem) => void }) {
  const [editing, setEditing] = useState<string | null>(null)
  return (
    <Card tone="white">
      <p className="font-semibold">Your pills</p>
      <ul className="mt-3 space-y-2">
        {pills.map((p) => (
          <li key={p.id} className="rounded-2xl bg-cream px-3 py-2">
            {editing === p.id ? (
              <PillForm
                initial={p}
                submitLabel="Save"
                onCancel={() => setEditing(null)}
                onSubmit={(next) => {
                  onChange(pills.map((x) => (x.id === p.id ? next : x)))
                  setEditing(null)
                }}
              />
            ) : (
              <div className="flex items-center gap-3">
                <span aria-hidden className="h-4 w-4 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                <button aria-label={`Edit ${p.name}`} onClick={() => setEditing(p.id)} className="rounded-full p-2 active:scale-90">
                  <Pencil size={16} />
                </button>
                <button
                  aria-label={`Delete ${p.name}`}
                  disabled={pills.length === 1}
                  onClick={() => onDeleted(p)}
                  className="rounded-full p-2 active:scale-90 disabled:opacity-30"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mb-2 mt-4 text-sm font-semibold">Add a pill</p>
      <PillForm
        initial={{ id: '', name: '', color: PILL_COLORS[pills.length % PILL_COLORS.length] }}
        submitLabel="Add pill"
        onSubmit={(pill) => onChange([...pills, { ...pill, id: newPillId() }])}
      />
    </Card>
  )
}

export default function SettingsPage() {
  const { settings, update } = useSettings()
  const [denied, setDenied] = useState(() => notificationsSupported() && Notification.permission === 'denied')

  const toggle = async (key: 'morningReminderEnabled' | 'eveningReminderEnabled') => {
    const patch: Partial<UserSettings> = {}
    if (settings[key]) {
      patch[key] = false
    } else {
      const permission = await requestPermission()
      setDenied(permission === 'denied')
      // The evening cat prompt works in-app even without notification permission.
      patch[key] = permission === 'granted' || key === 'eveningReminderEnabled'
    }
    update(patch)
  }

  const [message, setMessage] = useState<string | null>(null)

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(null), 2500)
  }

  const sendTest = async () => {
    if (!notificationsSupported()) return flash('Notifications aren’t supported in this browser.')
    try {
      const permission = await triggerTestNotification()
      setDenied(permission === 'denied')
      flash(
        permission === 'granted'
          ? 'Test notification sent! Check your device notifications.'
          : 'Notifications are blocked. Enable them in your browser or device settings.',
      )
    } catch {
      flash('Could not send the test notification.')
    }
  }

  const resetToday = async () => {
    try {
      const today = toDateKey()
      const logs = await db.getAll('pillLogs')
      await Promise.all(logs.filter((l) => l.date === today).map((l) => db.remove('pillLogs', l.id)))
      window.dispatchEvent(new Event(LOGS_CHANGED_EVENT))
      flash("Today's log cleared!")
    } catch {
      flash('Could not clear today’s log.')
    }
  }

  const deletePill = async (pill: PillItem) => {
    if (settings.pills.length === 1) return
    if (!window.confirm(`Delete "${pill.name}" and all of its history?`)) return
    try {
      const logs = await db.getAll('pillLogs')
      await Promise.all(logs.filter((l) => l.pillId === pill.id).map((l) => db.remove('pillLogs', l.id)))
      update({ pills: settings.pills.filter((p) => p.id !== pill.id) })
      window.dispatchEvent(new Event(LOGS_CHANGED_EVENT))
      flash(`${pill.name} deleted.`)
    } catch {
      flash('Could not delete that pill.')
    }
  }

  const resetAll = async () => {
    if (!window.confirm('Are you sure? This will clear all history')) return
    try {
      await db.clear('pillLogs')
      saveSettings(DEFAULT_SETTINGS)
      window.dispatchEvent(new Event(LOGS_CHANGED_EVENT))
      setDenied(notificationsSupported() && Notification.permission === 'denied')
      flash('All data cleared!')
    } catch {
      flash('Could not clear data.')
    }
  }

  return (
    <>
      <PageHeader title="Settings" />
      <div className="space-y-4">
        <CatPicker value={settings.catBreed} onChange={(catBreed) => update({ catBreed })} />

        <PillManager pills={settings.pills} onChange={(pills) => update({ pills })} onDeleted={deletePill} />

        <ReminderCard
          tone="lavender"
          label="Morning reminder"
          description="A friendly nudge to start your day."
          enabled={settings.morningReminderEnabled}
          time={settings.morningReminderTime}
          timeLabel="Morning time"
          onToggle={() => toggle('morningReminderEnabled')}
          onTime={(morningReminderTime) => update({ morningReminderTime })}
          onTest={sendTest}
        />

        <ReminderCard
          tone="peach"
          label="Evening reminder"
          description="If your pill isn’t logged, the cat asks again every 5 minutes while the app is open."
          enabled={settings.eveningReminderEnabled}
          time={settings.eveningReminderTime}
          timeLabel="Evening time"
          onToggle={() => toggle('eveningReminderEnabled')}
          onTime={(eveningReminderTime) => update({ eveningReminderTime })}
          onTest={sendTest}
        />

        {!notificationsSupported() && <p className="text-sm">Notifications aren’t supported in this browser.</p>}
        {denied && <p className="text-sm">Notifications are blocked. Enable them in your browser or device settings.</p>}

        <Card tone="sky">
          <div className="flex gap-3 text-sm">
            <Info size={20} className="mt-0.5 shrink-0" aria-hidden />
            <p>
              To receive push reminders on iPhone, open this site in Safari, tap the Share button, and select 'Add to
              Home Screen'.
            </p>
          </div>
        </Card>

        <Card tone="white">
          <p className="text-sm">All data is stored privately on this device.</p>
        </Card>

        <Card tone="white">
          <p className="font-semibold">Data</p>
          <div className="mt-3 flex flex-col gap-2">
            <button onClick={resetToday} className="rounded-xl bg-peach px-4 py-3 text-sm font-semibold">
              Reset Today’s Check-in
            </button>
            <button onClick={resetAll} className="rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-cream">
              Reset All Data
            </button>
          </div>
        </Card>
      </div>

      {message && (
        <div
          role="status"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 rounded-full bg-ink px-5 py-2 text-sm font-semibold text-cream shadow-lg"
        >
          {message}
        </div>
      )}
    </>
  )
}
