import type { ReactNode } from 'react'

const TONES = {
  peach: 'bg-peach',
  mint: 'bg-mint',
  lavender: 'bg-lavender',
  sky: 'bg-sky',
  white: 'bg-white',
} as const

export default function Card({ tone = 'white', children }: { tone?: keyof typeof TONES; children: ReactNode }) {
  return <section className={`rounded-3xl p-4 shadow-sm shadow-ink/5 ${TONES[tone]}`}>{children}</section>
}
