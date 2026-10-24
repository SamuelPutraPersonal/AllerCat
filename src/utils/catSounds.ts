import type { CatBreed } from '../storage'

/** `tap` when the cat is petted, `happy` when a check-in is saved (a touch brighter). */
export type CatSoundKind = 'tap' | 'happy'

let ctx: AudioContext | null = null
let out: GainNode | null = null
let current: GainNode | null = null

function audio(): { ac: AudioContext; out: GainNode } | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx || !out) {
    ctx = new Ctor()
    // A compressor keeps stacked oscillators from clipping on small speakers.
    const comp = ctx.createDynamicsCompressor()
    out = ctx.createGain()
    out.gain.value = 0.8
    out.connect(comp).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return { ac: ctx, out }
}

interface Meow {
  from: number
  peak: number
  to: number
  dur: number
  vol: number
  /** Formant sweep: closed "mee" to open "ow". Lower = darker, softer voice. */
  f1: [number, number]
  f2: [number, number]
}

function envelope(ac: AudioContext, dest: AudioNode, t: number, dur: number, vol: number, attack = 0.04): GainNode {
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  g.connect(dest)
  return g
}

function meow(ac: AudioContext, dest: AudioNode, t: number, m: Meow) {
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.setValueAtTime(m.from, t)
  osc.frequency.exponentialRampToValueAtTime(m.peak, t + m.dur * 0.3)
  osc.frequency.exponentialRampToValueAtTime(m.to, t + m.dur)

  const env = envelope(ac, dest, t, m.dur, m.vol)
  ;([m.f1, m.f2] as const).forEach((f, i) => {
    const bp = ac.createBiquadFilter()
    bp.type = 'bandpass'
    bp.Q.value = 4
    bp.frequency.setValueAtTime(f[0], t)
    bp.frequency.exponentialRampToValueAtTime(f[1], t + m.dur)
    const makeup = ac.createGain()
    makeup.gain.value = i === 0 ? 3 : 1.8
    osc.connect(bp).connect(makeup).connect(env)
  })
  osc.start(t)
  osc.stop(t + m.dur + 0.05)
}

/** Low rumble with a ~25Hz amplitude flutter, faded in and out. */
function purr(ac: AudioContext, dest: AudioNode, t: number, dur: number, base: number, vol: number) {
  const osc = ac.createOscillator()
  osc.type = 'sawtooth'
  osc.frequency.value = base
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 420

  const flutter = ac.createGain()
  flutter.gain.value = 0.5
  const lfo = ac.createOscillator()
  lfo.frequency.value = 25
  const depth = ac.createGain()
  depth.gain.value = 0.5
  lfo.connect(depth).connect(flutter.gain)

  const env = ac.createGain()
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.3, dur / 3))
  env.gain.setValueAtTime(vol, t + dur - Math.min(0.4, dur / 3))
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  env.connect(dest)

  osc.connect(lp).connect(flutter).connect(env)
  osc.start(t)
  lfo.start(t)
  osc.stop(t + dur + 0.05)
  lfo.stop(t + dur + 0.05)
}

/** Rolled "brrrp": a triangle wave whose pitch wobbles ~25 times a second. */
function trill(ac: AudioContext, dest: AudioNode, t: number, dur: number, center: number, vol: number) {
  const osc = ac.createOscillator()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(center * 0.9, t)
  osc.frequency.linearRampToValueAtTime(center * 1.25, t + dur)
  const lfo = ac.createOscillator()
  lfo.frequency.value = 26
  const depth = ac.createGain()
  depth.gain.value = center * 0.22
  lfo.connect(depth).connect(osc.frequency)
  osc.connect(envelope(ac, dest, t, dur, vol, 0.03))
  osc.start(t)
  lfo.start(t)
  osc.stop(t + dur + 0.05)
  lfo.stop(t + dur + 0.05)
}

/** Plays the breed's signature sound. Safe to call without audio support; it just does nothing. */
export function playCatSound(breed: CatBreed, kind: CatSoundKind = 'tap') {
  const a = audio()
  if (!a) return
  const { ac } = a

  // Fade out whatever is still sounding so taps don't pile up.
  const t0 = ac.currentTime
  if (current) {
    current.gain.cancelScheduledValues(t0)
    current.gain.setTargetAtTime(0, t0, 0.03)
  }
  const bus = ac.createGain()
  bus.connect(a.out)
  current = bus

  const t = t0 + 0.02
  const k = kind === 'happy' ? 1.1 : 1 // happy = slightly higher pitch
  switch (breed) {
    case 'three-color': {
      // High, cheerful double meow.
      const m = { from: 700 * k, peak: 1250 * k, to: 850 * k, dur: 0.38, vol: 0.5, f1: [500, 900], f2: [2600, 1700] } satisfies Meow
      meow(ac, bus, t, m)
      meow(ac, bus, t + 0.46, { ...m, peak: 1400 * k, dur: 0.34 })
      break
    }
    case 'orange':
      // Playful medium meow rolling into a purr.
      meow(ac, bus, t, { from: 450 * k, peak: 780 * k, to: 520 * k, dur: 0.45, vol: 0.5, f1: [450, 850], f2: [2200, 1300] })
      purr(ac, bus, t + 0.42, kind === 'happy' ? 1.4 : 0.9, 85, 0.55)
      break
    case 'black':
      // Soft, low, gentle meow.
      meow(ac, bus, t, { from: 300 * k, peak: 440 * k, to: 280 * k, dur: 0.7, vol: 0.32, f1: [350, 600], f2: [1500, 950] })
      break
    case 'ragdoll':
      // Soothing low purr.
      purr(ac, bus, t, kind === 'happy' ? 3 : 2.2, 62 * k, 0.7)
      break
    case 'maine-coon':
      // Deep chirpy trill and a "mew-mew".
      trill(ac, bus, t, 0.3, 430 * k, 0.5)
      meow(ac, bus, t + 0.42, { from: 380 * k, peak: 640 * k, to: 450 * k, dur: 0.2, vol: 0.4, f1: [450, 750], f2: [2000, 1300] })
      meow(ac, bus, t + 0.68, { from: 400 * k, peak: 700 * k, to: 460 * k, dur: 0.22, vol: 0.4, f1: [450, 750], f2: [2000, 1300] })
      break
  }
}
