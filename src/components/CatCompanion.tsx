import { useId } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { useSettings } from '../hooks/useSettings'
import { playCatSound } from '../utils/catSounds'
import type { CatBreed } from '../storage'

export type CatStatus = 'pending' | 'taken' | 'symptoms' | 'impatient'

const MESSAGES: Record<CatStatus, string> = {
  pending: 'Time for your daily pill!',
  impatient: 'Still waiting for your pill! I’ll check back in 5 minutes!',
  taken: 'Great job! Pill taken!',
  symptoms: 'Hope you feel better soon! Logged your symptoms.',
}

const INK = '#4a3b47'
const BLUSH = '#f7b8c4'

interface Palette {
  fur: string
  /** Stripes, belly tone, ear shading. */
  shade: string
  earInner: string
  /** Muzzle / chest highlight. */
  light: string
  /** Paw color (ragdoll points). */
  paw: string
  tail: string
  /** Fill of open eyes. */
  eye: string
  /** Strokes: closed eyes, brows, mouth, nose outline, whiskers. */
  line: string
  cheek: string
}

const PALETTES: Record<CatBreed, Palette> = {
  'three-color': { fur: '#ffffff', shade: '#fdd9c4', earInner: BLUSH, light: '#ffffff', paw: '#ffffff', tail: '#f2a65a', eye: INK, line: INK, cheek: BLUSH },
  orange: { fur: '#f5b36b', shade: '#d9843c', earInner: BLUSH, light: '#fde6c6', paw: '#f5b36b', tail: '#f5b36b', eye: INK, line: INK, cheek: '#f08fa0' },
  black: { fur: '#3d3b48', shade: '#2b2933', earInner: '#8a6577', light: '#4b4959', paw: '#3d3b48', tail: '#3d3b48', eye: '#f4cf4a', line: '#f1e4c9', cheek: '#c97b92' },
  ragdoll: { fur: '#fbf5ec', shade: '#e9dccd', earInner: BLUSH, light: '#ffffff', paw: '#8f7c78', tail: '#8f7c78', eye: '#4f9bd9', line: INK, cheek: BLUSH },
  'maine-coon': { fur: '#a98260', shade: '#6f503a', earInner: '#d79aa5', light: '#e3cfb2', paw: '#a98260', tail: '#a98260', eye: '#6fae56', line: INK, cheek: '#d9919e' },
}

export const BREED_LABELS: Record<CatBreed, string> = {
  'three-color': 'Calico',
  orange: 'Orange Tabby',
  black: 'Midnight',
  ragdoll: 'Ragdoll',
  'maine-coon': 'Maine Coon',
}

const EARS = { left: 'M54 52 L58 22 L84 40Z', right: 'M146 52 L142 22 L116 40Z' }
const EAR_INNER = { left: 'M62 44 L63 31 L76 40Z', right: 'M138 44 L137 31 L124 40Z' }

function Heart({ x, y, delay, size = 1 }: { x: number; y: number; delay: string; size?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${size})`}>
      <path
        className="cat-float"
        style={{ animationDelay: delay }}
        d="M0 4 C-8 -3 -4 -10 0 -5 C4 -10 8 -3 0 4Z"
        fill={BLUSH}
      />
    </g>
  )
}

function Eyes({ status, p }: { status: CatStatus; p: Palette }) {
  if (status === 'taken') {
    // Happy ^ ^ eyes
    return (
      <g fill="none" stroke={p.line} strokeWidth="3.5" strokeLinecap="round">
        <path d="M70 70 Q78 60 86 70" />
        <path d="M114 70 Q122 60 130 70" />
      </g>
    )
  }
  if (status === 'impatient') {
    // Wide open eyes with worried brows
    return (
      <g>
        <g className="cat-blink">
          <ellipse cx="78" cy="72" rx="5.5" ry="7.5" fill={p.eye} />
          <ellipse cx="122" cy="72" rx="5.5" ry="7.5" fill={p.eye} />
          <ellipse cx="78" cy="72" rx="2.6" ry="5.5" fill={INK} />
          <ellipse cx="122" cy="72" rx="2.6" ry="5.5" fill={INK} />
          <circle cx="79.5" cy="69.5" r="1.8" fill="#fff" />
          <circle cx="123.5" cy="69.5" r="1.8" fill="#fff" />
        </g>
        <g fill="none" stroke={p.line} strokeWidth="2.5" strokeLinecap="round" opacity=".6">
          <path d="M68 56 L86 62" />
          <path d="M132 56 L114 62" />
        </g>
      </g>
    )
  }
  if (status === 'symptoms') {
    // Soft, gently closed eyes with worried brows
    return (
      <g fill="none" stroke={p.line} strokeWidth="3.5" strokeLinecap="round">
        <path d="M70 70 Q78 77 86 70" />
        <path d="M114 70 Q122 77 130 70" />
        <path d="M68 60 L84 56" strokeWidth="2.5" opacity=".55" />
        <path d="M132 60 L116 56" strokeWidth="2.5" opacity=".55" />
      </g>
    )
  }
  return (
    <g className="cat-blink">
      <ellipse cx="78" cy="70" rx="5" ry="6.5" fill={p.eye} />
      <ellipse cx="122" cy="70" rx="5" ry="6.5" fill={p.eye} />
      <ellipse cx="78" cy="70" rx="2.4" ry="5" fill={INK} />
      <ellipse cx="122" cy="70" rx="2.4" ry="5" fill={INK} />
      <circle cx="79.5" cy="68" r="1.6" fill="#fff" />
      <circle cx="123.5" cy="68" r="1.6" fill="#fff" />
    </g>
  )
}

function Mouth({ status, p }: { status: CatStatus; p: Palette }) {
  const d =
    status === 'taken'
      ? 'M92 84 Q100 96 108 84 Q100 88 92 84Z'
      : status === 'symptoms' || status === 'impatient'
        ? 'M93 90 Q100 85 107 90'
        : 'M93 85 Q96.5 89 100 85 Q103.5 89 107 85'
  return (
    <path
      d={d}
      fill={status === 'taken' ? BLUSH : 'none'}
      stroke={p.line}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  )
}

/** Breed markings painted on the head, clipped to the head + ears silhouette. */
function HeadMarkings({ breed, p, clip }: { breed: CatBreed; p: Palette; clip: string }) {
  const stripes = (
    <g stroke={p.shade} strokeWidth="4" strokeLinecap="round" fill="none">
      <path d="M100 30 V42" />
      <path d="M90 32 L92 42" />
      <path d="M110 32 L108 42" />
    </g>
  )
  switch (breed) {
    case 'three-color':
      return (
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="68" cy="38" rx="24" ry="22" fill="#f2a65a" />
          <ellipse cx="143" cy="44" rx="22" ry="24" fill="#5a5560" />
          <ellipse cx="58" cy="76" rx="12" ry="9" fill="#f2a65a" opacity=".9" />
        </g>
      )
    case 'orange':
      return (
        <>
          {stripes}
          <g stroke={p.shade} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".85">
            <path d="M50 64 L62 66" />
            <path d="M50 74 L61 74" />
            <path d="M150 64 L138 66" />
            <path d="M150 74 L139 74" />
          </g>
          <ellipse cx="100" cy="86" rx="21" ry="13" fill={p.light} />
        </>
      )
    case 'black':
      return <ellipse cx="82" cy="44" rx="15" ry="5.5" transform="rotate(-18 82 44)" fill="#605e73" opacity=".55" />
    case 'ragdoll':
      return (
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="100" cy="82" rx="34" ry="26" fill={p.paw} opacity=".5" />
          <ellipse cx="100" cy="30" rx="48" ry="12" fill={p.paw} opacity=".35" />
          <path d="M100 38 Q93 66 100 82 Q107 66 100 38Z" fill={p.fur} />
        </g>
      )
    case 'maine-coon':
      return (
        <>
          {stripes}
          <g stroke={p.shade} strokeWidth="3.5" strokeLinecap="round" fill="none" opacity=".8">
            <path d="M50 62 L63 65" />
            <path d="M50 72 L62 73" />
            <path d="M150 62 L137 65" />
            <path d="M150 72 L138 73" />
          </g>
          <ellipse cx="100" cy="86" rx="22" ry="13" fill={p.light} />
        </>
      )
  }
}

/** Ear accents: tufts and dark tips drawn over the ear triangles. */
function EarAccents({ breed, p }: { breed: CatBreed; p: Palette }) {
  if (breed === 'maine-coon') {
    return (
      <g stroke={p.shade} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M58 22 L54 10" />
        <path d="M62 27 L55 17" />
        <path d="M142 22 L146 10" />
        <path d="M138 27 L145 17" />
      </g>
    )
  }
  return null
}

/** The head: ears, face, markings, expression. Shared by the full cat and the settings previews. */
function CatHead({ breed, status, clip }: { breed: CatBreed; status: CatStatus; clip: string }) {
  const p = PALETTES[breed]
  const earFill = breed === 'ragdoll' ? p.paw : breed === 'three-color' ? '#ffffff' : p.fur
  return (
    <>
      <defs>
        <clipPath id={clip}>
          <path d={EARS.left} />
          <path d={EARS.right} />
          <ellipse cx="100" cy="68" rx="50" ry="40" />
        </clipPath>
      </defs>
      <path d={EARS.left} fill={earFill} />
      <path d={EARS.right} fill={earFill} />
      <path d={EAR_INNER.left} fill={p.earInner} />
      <path d={EAR_INNER.right} fill={p.earInner} />
      <ellipse cx="100" cy="68" rx="50" ry="40" fill={p.fur} />
      <HeadMarkings breed={breed} p={p} clip={clip} />
      <EarAccents breed={breed} p={p} />
      <Eyes status={status} p={p} />
      <ellipse cx="62" cy="82" rx="8" ry="5" fill={p.cheek} opacity={status === 'taken' ? 0.9 : 0.55} />
      <ellipse cx="138" cy="82" rx="8" ry="5" fill={p.cheek} opacity={status === 'taken' ? 0.9 : 0.55} />
      <path d="M96 78 L104 78 L100 83Z" fill={BLUSH} stroke={p.line} strokeWidth="1.5" strokeLinejoin="round" />
      <Mouth status={status} p={p} />
      {/* whiskers */}
      <g stroke={p.line} strokeWidth="1.8" strokeLinecap="round" opacity={breed === 'black' ? 0.55 : 0.35}>
        <path d="M44 74 L26 70" />
        <path d="M44 82 L26 86" />
        <path d="M156 74 L174 70" />
        <path d="M156 82 L174 86" />
      </g>
    </>
  )
}

/** Fluffy ruff behind the head (Ragdoll, Maine Coon). */
function Collar({ p, big }: { p: Palette; big: boolean }) {
  const xs = big ? [52, 66, 80, 94, 108, 122, 136, 148] : [60, 74, 88, 100, 112, 126, 140]
  const r = big ? 15 : 12
  return (
    <g fill={p.light}>
      <ellipse cx="100" cy="108" rx={big ? 54 : 44} ry={big ? 17 : 13} />
      {xs.map((x, i) => (
        <circle key={x} cx={x} cy={112 + (i % 2) * 4} r={r} />
      ))}
    </g>
  )
}

function BodyMarkings({ breed, p, clip }: { breed: CatBreed; p: Palette; clip: string }) {
  switch (breed) {
    case 'three-color':
      return (
        <g clipPath={`url(#${clip})`}>
          <ellipse cx="76" cy="122" rx="24" ry="20" fill="#f2a65a" />
          <ellipse cx="132" cy="142" rx="22" ry="18" fill="#5a5560" />
        </g>
      )
    case 'orange':
    case 'maine-coon':
      return (
        <g clipPath={`url(#${clip})`} stroke={p.shade} strokeWidth="4" strokeLinecap="round" fill="none" opacity=".75">
          <path d="M60 112 Q70 122 60 134" />
          <path d="M72 108 Q82 120 72 134" />
          <path d="M128 108 Q118 120 128 134" />
          <path d="M140 112 Q130 122 140 134" />
        </g>
      )
    case 'black':
      return <ellipse cx="82" cy="118" rx="20" ry="6" transform="rotate(-14 82 118)" fill="#605e73" opacity=".4" />
    default:
      return null
  }
}

function CatBody({ breed, clip, children }: { breed: CatBreed; clip: string; children: React.ReactNode }) {
  const p = PALETTES[breed]
  const fluffy = breed === 'ragdoll' || breed === 'maine-coon'
  const tabbyTail = breed === 'orange' || breed === 'maine-coon'
  const tailPath = 'M142 138 Q178 132 170 100 Q166 88 156 96'
  return (
    <g className="cat-body">
      <defs>
        <clipPath id={clip}>
          <ellipse cx="100" cy="132" rx="46" ry="30" />
        </clipPath>
      </defs>
      {/* tail */}
      <g className="cat-tail">
        <path d={tailPath} fill="none" stroke={p.tail} strokeWidth={breed === 'maine-coon' ? 19 : 13} strokeLinecap="round" />
        {tabbyTail && (
          <path d={tailPath} fill="none" stroke={p.shade} strokeWidth={breed === 'maine-coon' ? 19 : 13} strokeDasharray="4 9" opacity=".7" />
        )}
      </g>
      {/* body */}
      <ellipse cx="100" cy="132" rx="46" ry="30" fill={p.fur} />
      <BodyMarkings breed={breed} p={p} clip={clip} />
      <ellipse cx="100" cy="140" rx="26" ry="18" fill={breed === 'three-color' ? p.shade : p.light} opacity={breed === 'black' ? 0.35 : 0.55} />
      {/* back paws */}
      <ellipse cx="74" cy="158" rx="14" ry="7" fill={p.paw} />
      <ellipse cx="126" cy="158" rx="14" ry="7" fill={p.paw} />
      {/* front paws; the right one taps while waiting */}
      <ellipse cx="86" cy="156" rx="9" ry="12" fill={p.paw} />
      <ellipse className="cat-paw" cx="114" cy="156" rx="9" ry="12" fill={p.paw} />
      {fluffy && <Collar p={p} big={breed === 'maine-coon'} />}
      {children}
    </g>
  )
}

/** Head-only preview of a breed, used by the settings picker. */
export function CatAvatar({ breed, className = 'h-16 w-16' }: { breed: CatBreed; className?: string }) {
  const clip = `avatar-${useId().replace(/:/g, '')}`
  return (
    <span className="cat-companion">
      <svg viewBox="20 8 160 110" className={className} role="img" aria-label={`${BREED_LABELS[breed]} cat`}>
        {(breed === 'ragdoll' || breed === 'maine-coon') && <Collar p={PALETTES[breed]} big={breed === 'maine-coon'} />}
        <CatHead breed={breed} status="pending" clip={clip} />
      </svg>
    </span>
  )
}

export default function CatCompanion({ status }: { status: CatStatus }) {
  const { settings, update } = useSettings()
  const breed = settings.catBreed
  const sound = settings.soundEnabled
  const ids = useId().replace(/:/g, '')
  const message = MESSAGES[status]
  const tone =
    status === 'pending' ? 'bg-white' : status === 'taken' ? 'bg-mint' : status === 'impatient' ? 'bg-peach' : 'bg-lavender'

  return (
    <section
      className={`cat-companion cat-${status} relative mx-auto flex w-full max-w-sm flex-col items-center gap-2 py-2`}
      aria-label="Cat companion"
    >
      <button
        aria-pressed={sound}
        aria-label={sound ? 'Mute cat sounds' : 'Unmute cat sounds'}
        onClick={() => {
          update({ soundEnabled: !sound })
          if (!sound) playCatSound(breed)
        }}
        className="absolute right-0 top-2 z-10 rounded-full bg-white/80 p-2 shadow-sm transition-transform active:scale-90"
      >
        {sound ? <Volume2 size={18} /> : <VolumeX size={18} />}
      </button>
      <p
        key={status}
        role="status"
        className={`animate-rise-in relative max-w-[17rem] rounded-3xl px-4 py-2.5 text-center text-sm font-semibold leading-snug shadow-sm ${tone}`}
      >
        {message}
        <span aria-hidden className={`absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 ${tone}`} />
      </p>

      <button
        onClick={() => sound && playCatSound(breed)}
        aria-label={sound ? 'Pet the cat to hear it' : 'Cat sounds are muted'}
        className="w-full max-w-[15rem] rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-blush"
      >
      <svg
        viewBox="0 0 200 170"
        className="w-full"
        role="img"
        aria-label={
          status === 'pending'
            ? `A ${BREED_LABELS[breed]} cat patiently tapping its paw`
            : status === 'impatient'
              ? `A worried ${BREED_LABELS[breed]} cat impatiently tapping its paw`
              : status === 'taken'
                ? `A happy dancing ${BREED_LABELS[breed]} cat`
                : `A caring ${BREED_LABELS[breed]} cat`
        }
      >
        {status === 'symptoms' && <circle className="cat-glow" cx="100" cy="95" r="70" fill="#dcd3f5" />}
        {status === 'taken' && (
          <>
            <Heart x={32} y={60} delay="0s" />
            <Heart x={170} y={50} delay="0.6s" size={1.2} />
            <Heart x={150} y={20} delay="1.2s" size={0.8} />
            <Heart x={50} y={22} delay="1.8s" size={0.9} />
          </>
        )}

        <ellipse cx="100" cy="162" rx="48" ry="5" fill={INK} opacity=".08" />

        <CatBody breed={breed} clip={`${ids}-body`}>
          <g className="cat-head">
            <CatHead breed={breed} status={status} clip={`${ids}-head`} />
          </g>
        </CatBody>

        {(status === 'pending' || status === 'impatient') && (
          <g className="cat-tap-lines" stroke={INK} strokeWidth="2.5" strokeLinecap="round" opacity=".4">
            <path d="M132 166 L140 166" />
            <path d="M130 160 L137 156" />
          </g>
        )}
      </svg>
      </button>
    </section>
  )
}
