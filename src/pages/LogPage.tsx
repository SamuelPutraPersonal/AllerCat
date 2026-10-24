import { useMemo, useState } from 'react'
import { Copy, FileText, Share2, X } from 'lucide-react'
import PageHeader from '../components/PageHeader'
import Card from '../components/Card'
import CheckInCard from '../components/CheckInCard'
import LogCalendar from '../components/LogCalendar'
import StatsRecap from '../components/StatsRecap'
import { useStore } from '../hooks/useStore'
import { useSettings } from '../hooks/useSettings'
import { buildReport } from '../lib/report'
import { logsForPill } from '../lib/streak'

export default function LogPage() {
  const { items: allItems, save, remove } = useStore('pillLogs')
  const { settings } = useSettings()
  const [pillId, setPillId] = useState(settings.pills[0].id)
  // Fall back to the first pill if the selected one was deleted in Settings.
  const pill = settings.pills.find((p) => p.id === pillId) ?? settings.pills[0]
  const items = useMemo(() => logsForPill(allItems, pill.id), [allItems, pill.id])
  const history = [...items].sort((a, b) => b.date.localeCompare(a.date))
  const [report, setReport] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const copy = async () => {
    if (!report) return
    try {
      await navigator.clipboard.writeText(report)
      setFeedback('Copied to clipboard!')
    } catch {
      setFeedback('Couldn’t copy — select the text and copy manually.')
    }
  }

  const share = async () => {
    if (!report) return
    try {
      await navigator.share({ title: 'Allergy Immunotherapy Daily Log', text: report })
    } catch (e) {
      if ((e as DOMException).name !== 'AbortError') setFeedback('Sharing failed — try Copy instead.')
    }
  }

  return (
    <>
      <PageHeader title="Log" subtitle="Daily pill check-ins and symptoms" />
      <div className="space-y-4">
        {settings.pills.length > 1 && (
          <label className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3">
            <span aria-hidden className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: pill.color }} />
            <span className="text-sm font-semibold">Pill</span>
            <select
              value={pill.id}
              onChange={(e) => {
                setPillId(e.target.value)
                setReport(null)
              }}
              className="min-w-0 flex-1 rounded-xl bg-cream px-3 py-2 text-base outline-none focus:ring-2 focus:ring-blush"
            >
              {settings.pills.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
        )}

        <button
          onClick={() => {
            setFeedback('')
            setReport(buildReport(items, 30, settings.pills.length > 1 ? pill.name : undefined))
          }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 text-base font-bold text-cream transition-transform active:scale-95"
        >
          <FileText size={20} /> Export for Doctor
        </button>

        {report && (
          <Card tone="sky">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Doctor report</h2>
              <button aria-label="Close report" onClick={() => setReport(null)} className="rounded-full p-1">
                <X size={18} />
              </button>
            </div>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-2xl bg-white p-3 text-xs">{report}</pre>
            <div className="mt-3 flex gap-3">
              <button
                onClick={copy}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold active:scale-95"
              >
                <Copy size={16} /> Copy to Clipboard
              </button>
              {canShare && (
                <button
                  onClick={share}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-ink py-3 text-sm font-semibold text-cream active:scale-95"
                >
                  <Share2 size={16} /> Share
                </button>
              )}
            </div>
            <p className="mt-2 text-xs text-ink-soft" aria-live="polite">{feedback}</p>
          </Card>
        )}

        <CheckInCard />
        <StatsRecap logs={items} />
        <LogCalendar logs={items} pill={pill} onSave={save} onDelete={remove} />
        <h2 className="pt-2 text-sm font-semibold text-ink-soft">History</h2>
        {history.length === 0 ? (
          <Card tone="lavender">
            <p className="text-sm">No entries yet.</p>
          </Card>
        ) : (
          <ul className="space-y-3">
            {history.map((l) => (
              <li key={l.id}>
                <Card tone={l.hasSymptoms ? 'lavender' : 'mint'}>
                  <p className="font-semibold">{l.date}</p>
                  <p className="text-sm text-ink-soft">
                    {l.pillTaken ? 'Pill taken' : 'Missed'} · {l.hasSymptoms ? l.symptoms.join(', ') : 'No symptoms'}
                  </p>
                  {l.notes && <p className="mt-1 text-sm">{l.notes}</p>}
                </Card>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}
