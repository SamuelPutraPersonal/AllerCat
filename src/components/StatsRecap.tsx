import { useMemo } from 'react'
import Card from './Card'
import { buildRecap, catCommentary, type Adherence } from '../utils/stats'
import type { PillLog } from '../storage'

function AdherenceBar({ label, a }: { label: string; a: Adherence }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-ink-soft">
          {a.taken} taken · {a.missed} missed{a.percent !== null && ` · ${a.percent}%`}
        </span>
      </div>
      <div
        className="h-3 overflow-hidden rounded-full bg-white"
        role="progressbar"
        aria-label={`${label} adherence`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={a.percent ?? 0}
      >
        <div className="h-full rounded-full bg-ink transition-all" style={{ width: `${a.percent ?? 0}%` }} />
      </div>
    </div>
  )
}

/** `logs` must belong to a single pill. */
export default function StatsRecap({ logs }: { logs: PillLog[] }) {
  const recap = useMemo(() => buildRecap(logs), [logs])
  const comment = catCommentary(recap)
  const top = recap.symptoms[0]?.count ?? 1

  return (
    <Card tone="mint">
      <h2 className="mb-3 text-sm font-semibold">Weekly &amp; monthly recap</h2>

      <p className="mb-4 flex items-start gap-2 rounded-2xl bg-white/70 px-3 py-2 text-sm" role="status">
        <span aria-hidden className="text-lg leading-none">{comment.emoji}</span>
        <span>{comment.text}</span>
      </p>

      <div className="space-y-3">
        <AdherenceBar label="This week" a={recap.week} />
        <AdherenceBar label="This month" a={recap.month} />
      </div>

      <h3 className="mb-2 mt-5 text-sm font-semibold">Symptoms · last 30 days</h3>
      {recap.symptoms.length === 0 ? (
        <p className="text-sm">No symptoms recorded. 🎈</p>
      ) : (
        <ol className="space-y-2">
          {recap.symptoms.map(({ symptom, count }) => (
            <li key={symptom}>
              <div className="flex justify-between text-sm">
                <span>{symptom}</span>
                <span className="font-medium">{count} {count === 1 ? 'time' : 'times'}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-blush" style={{ width: `${(count / top) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
