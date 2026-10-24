import CatCompanion from './CatCompanion'

interface Props {
  onTaken: () => void
  onNotYet: () => void
}

/** Evening nag: the cat waits impatiently until the pill is logged. */
export default function SnoozePrompt({ onTaken, onNotYet }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Evening pill reminder"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-5"
    >
      <div className="animate-rise-in w-full max-w-sm rounded-3xl bg-cream p-5 shadow-xl">
        <CatCompanion status="impatient" />
        <p className="mt-2 text-center text-lg font-bold">Hey! Please take your pill 💊</p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={onTaken}
            className="rounded-2xl bg-ink py-4 text-lg font-bold text-cream transition-transform active:scale-95"
          >
            Yes, taken
          </button>
          <button
            onClick={onNotYet}
            className="rounded-2xl bg-white py-4 text-lg font-bold transition-transform active:scale-95"
          >
            Not Yet
          </button>
        </div>
      </div>
    </div>
  )
}
