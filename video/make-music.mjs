// Original soundtrack for the intro, synthesised from scratch (no samples, no licences).
// 120 BPM. Tense opening, riser into a hit at the logo, a warm groove for "how it works",
// whooshes on scene changes, and a final hit on the end card. Writes public/music.wav.
import fs from 'node:fs'

const SR = 44100
const DUR = 41
const N = SR * DUR
const L = new Float32Array(N)
const R = new Float32Array(N)
const BEAT = 0.5

const fps = 30
const CUTS = [150, 450, 600, 780, 930, 1050, 1110].map((f) => f / fps) // whooshes
const LOGO = 330 / fps // 11s: impact
const END = 1110 / fps // 37s: final hit
const GROOVE_FROM = LOGO
const GROOVE_TO = 35

let seed = 7
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32) * 2 - 1
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12)

function add(t0, buf, gain = 1, pan = 0) {
  const s0 = Math.floor(t0 * SR)
  const gl = gain * Math.min(1, 1 - pan), gr = gain * Math.min(1, 1 + pan)
  for (let i = 0; i < buf.length; i++) {
    const j = s0 + i
    if (j < 0 || j >= N) continue
    L[j] += buf[i] * gl
    R[j] += buf[i] * gr
  }
}

// One-pole filters
function lowpass(buf, cutoff) {
  const a = Math.exp(-2 * Math.PI * cutoff / SR); let y = 0
  for (let i = 0; i < buf.length; i++) { y = (1 - a) * buf[i] + a * y; buf[i] = y }
  return buf
}
function highpass(buf, cutoff) {
  const lp = lowpass(Float32Array.from(buf), cutoff)
  for (let i = 0; i < buf.length; i++) buf[i] -= lp[i]
  return buf
}

function kick(gain = 1) {
  const n = Math.floor(0.45 * SR), b = new Float32Array(n); let ph = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const f = 45 + 95 * Math.exp(-t * 28)
    ph += 2 * Math.PI * f / SR
    b[i] = Math.sin(ph) * Math.exp(-t * 7) * gain
  }
  return b
}
function clap() {
  const n = Math.floor(0.25 * SR), b = new Float32Array(n)
  for (let i = 0; i < n; i++) {
    const t = i / SR
    const env = Math.exp(-t * 18) * (t < 0.03 ? (Math.floor(t * 120) % 2 ? 0.6 : 1) : 1)
    b[i] = rnd() * env
  }
  return highpass(lowpass(b, 6000), 900)
}
function hat(open = false) {
  const n = Math.floor((open ? 0.18 : 0.05) * SR), b = new Float32Array(n)
  for (let i = 0; i < n; i++) b[i] = rnd() * Math.exp(-(i / SR) * (open ? 18 : 70))
  return highpass(b, 7000)
}
function tick() {
  const n = Math.floor(0.03 * SR), b = new Float32Array(n)
  for (let i = 0; i < n; i++) b[i] = Math.sin(2 * Math.PI * 2600 * i / SR) * Math.exp(-(i / SR) * 160)
  return b
}
// Detuned saw pad, softened
function pad(notes, dur, attack = 0.4, release = 0.8, cutoff = 1400) {
  const n = Math.floor((dur + release) * SR), b = new Float32Array(n)
  for (const m of notes) {
    for (const det of [-0.08, 0.08]) {
      const f = hz(m + det); let ph = Math.random()
      for (let i = 0; i < n; i++) {
        ph += f / SR; ph -= Math.floor(ph)
        const t = i / SR
        const env = Math.min(1, t / attack) * (t > dur ? Math.exp(-(t - dur) * 5 / release) : 1)
        b[i] += (2 * ph - 1) * env * 0.12
      }
    }
  }
  return lowpass(lowpass(b, cutoff), cutoff)
}
function pluck(m, gain = 1) {
  const n = Math.floor(0.6 * SR), b = new Float32Array(n), f = hz(m); let ph = 0
  for (let i = 0; i < n; i++) {
    ph += f / SR; ph -= Math.floor(ph)
    const tri = 4 * Math.abs(ph - 0.5) - 1
    b[i] = tri * Math.exp(-(i / SR) * 9) * gain
  }
  return lowpass(b, 3200)
}
function bass(m, dur) {
  const n = Math.floor(dur * SR), b = new Float32Array(n), f = hz(m); let ph = 0
  for (let i = 0; i < n; i++) {
    ph += 2 * Math.PI * f / SR
    const t = i / SR
    const env = Math.min(1, t / 0.01) * Math.exp(-t * 2.5)
    b[i] = Math.tanh(Math.sin(ph) * 1.6) * env
  }
  return b
}
function whoosh(len = 0.6) {
  const n = Math.floor(len * SR), b = new Float32Array(n); let y = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const cutoff = 300 + 5000 * Math.sin(Math.PI * t)
    const a = Math.exp(-2 * Math.PI * cutoff / SR)
    y = (1 - a) * rnd() + a * y
    b[i] = y * Math.sin(Math.PI * t) ** 2
  }
  return b
}
function riser(len) {
  const n = Math.floor(len * SR), b = new Float32Array(n); let y = 0, ph = 0
  for (let i = 0; i < n; i++) {
    const t = i / n
    const cutoff = 200 + 9000 * t * t
    const a = Math.exp(-2 * Math.PI * cutoff / SR)
    y = (1 - a) * rnd() + a * y
    ph += 2 * Math.PI * (200 + 900 * t * t) / SR
    b[i] = (y * 0.8 + Math.sin(ph) * 0.15) * t * t
  }
  return b
}
function impact() {
  const n = Math.floor(2.5 * SR), b = new Float32Array(n); let ph = 0
  for (let i = 0; i < n; i++) {
    const t = i / SR
    ph += 2 * Math.PI * (38 + 60 * Math.exp(-t * 10)) / SR
    b[i] = Math.sin(ph) * Math.exp(-t * 1.6) + rnd() * Math.exp(-t * 14) * 0.35
  }
  return b
}

// ── Opening (0–10s): tense pulse in A minor, clock ticks ────────────────────
for (let t = 0; t < 10; t += BEAT) {
  add(t, bass(33, 0.45), 0.35)
  add(t, tick(), 0.12, 0.3)
  add(t + 0.25, tick(), 0.07, -0.3)
}
add(0, pad([57, 60, 64], 10, 2, 1.2, 900), 0.6)
add(5, pad([45], 5, 1, 1, 600), 0.5)

// Riser into the logo
add(LOGO - 1.6, riser(1.6), 0.55)
add(LOGO, impact(), 0.9)

// ── Groove (11–35s): C – G – Am – F, one chord a bar ────────────────────────
const chords = [[60, 64, 67], [55, 59, 62, 67], [57, 60, 64], [53, 57, 60, 65]]
const roots = [36, 31, 33, 29]
const arps = [[72, 76, 79, 76], [71, 74, 79, 74], [72, 76, 81, 76], [72, 77, 81, 77]]
for (let t = GROOVE_FROM, k = 0; t < GROOVE_TO; t += 4 * BEAT, k++) {
  const c = k % 4
  add(t, pad(chords[c], 2, 0.15, 0.6, 1800), 0.55)
  add(t, bass(roots[c], 0.9), 0.5)
  add(t + 1.5, bass(roots[c], 0.45), 0.35)
  for (let b = 0; b < 4; b++) {
    const tb = t + b * BEAT
    if (tb >= GROOVE_TO) break
    if (b % 2 === 0) add(tb, kick(), 0.8)
    else add(tb, clap(), 0.32, 0.05)
    add(tb + 0.25, hat(), 0.16, 0.25)
    if (k > 1) add(tb, hat(), 0.08, -0.25)
    if (k > 0) {
      add(tb, pluck(arps[c][b], 1), 0.16, -0.3)
      add(tb + 0.25, pluck(arps[c][(b + 2) % 4] + 12, 1), 0.07, 0.3)
    }
  }
}

// ── Outro: warm chord, final hit on the end card, fade ──────────────────────
add(35, pad([60, 64, 67, 72], 6, 0.6, 1.5, 1400), 0.6)
add(END - 1, riser(1), 0.35)
add(END, impact(), 0.7)
add(END, pad([48, 55, 60, 64, 67], 3.5, 0.05, 1.5, 2200), 0.55)

for (const c of CUTS) add(c - 0.35, whoosh(0.7), 0.3, c % 2 ? 0.4 : -0.4)

// ── Master: gentle limiter, fades, normalise ────────────────────────────────
let peak = 0
for (let i = 0; i < N; i++) {
  const t = i / SR
  const fade = Math.min(1, t / 0.3) * (t > DUR - 2.5 ? Math.max(0, (DUR - t) / 2.5) : 1)
  L[i] = Math.tanh(L[i] * 1.1) * fade
  R[i] = Math.tanh(R[i] * 1.1) * fade
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]))
}
const norm = 0.89 / peak
const out = Buffer.alloc(44 + N * 4)
out.write('RIFF', 0); out.writeUInt32LE(36 + N * 4, 4); out.write('WAVE', 8)
out.write('fmt ', 12); out.writeUInt32LE(16, 16); out.writeUInt16LE(1, 20); out.writeUInt16LE(2, 22)
out.writeUInt32LE(SR, 24); out.writeUInt32LE(SR * 4, 28); out.writeUInt16LE(4, 32); out.writeUInt16LE(16, 34)
out.write('data', 36); out.writeUInt32LE(N * 4, 40)
for (let i = 0; i < N; i++) {
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, L[i] * norm)) * 32767), 44 + i * 4)
  out.writeInt16LE(Math.round(Math.max(-1, Math.min(1, R[i] * norm)) * 32767), 46 + i * 4)
}
fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/music.wav', out)
console.log(`music.wav: ${DUR}s, peak normalised from ${peak.toFixed(2)}`)
