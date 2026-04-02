import type { Page } from '../router'
import { fmt, queryRequired, getCanvasContext2D } from '../utils'
import { C_BG, C_INSIDE, C_AMBER, C_BORDER, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { getMethodIndex } from './definitions'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_PARTICLES = 200
const PARTICLE_RADIUS = 4
const TICKS_PER_FRAME = 2

// ─── Colors ──────────────────────────────────────────────────────────────────
const C_PARTICLE = C_INSIDE
const C_WALL = C_AMBER

// ─── Preview State ────────────────────────────────────────────────────────────
interface PreviewParticle {
  x: number
  y: number
  vx: number
  vy: number
}

const previewParticles: PreviewParticle[] = []
let previewInitialized = false

function initPreviewParticles(): void {
  if (previewInitialized) return
  previewInitialized = true

  const s = PREVIEW_SIZE
  const margin = 15
  const radius = 4

  for (let i = 0; i < 12; i++) {
    const angle = Math.random() * Math.PI * 2
    const speed = 1 + Math.random() * 1.5
    previewParticles.push({
      x: margin + radius + Math.random() * (s - margin * 2 - radius * 2),
      y: margin + radius + Math.random() * (s - margin * 2 - radius * 2),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    })
  }
}

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  initPreviewParticles()

  const s = PREVIEW_SIZE
  const margin = 5
  const radius = 4
  const innerMargin = margin + radius

  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  ctx.strokeStyle = C_BORDER
  ctx.lineWidth = 1
  ctx.strokeRect(margin, margin, s - margin * 2, s - margin * 2)

  // Update and draw particles with physics
  for (const p of previewParticles) {
    // Update position
    p.x += p.vx
    p.y += p.vy

    // Bounce off walls (elastic collision)
    if (p.x < innerMargin) {
      p.x = innerMargin
      p.vx = Math.abs(p.vx)
    } else if (p.x > s - innerMargin) {
      p.x = s - innerMargin
      p.vx = -Math.abs(p.vx)
    }
    if (p.y < innerMargin) {
      p.y = innerMargin
      p.vy = Math.abs(p.vy)
    } else if (p.y > s - innerMargin) {
      p.y = s - innerMargin
      p.vy = -Math.abs(p.vy)
    }

    // Draw particle with velocity-based coloring (same as main simulation)
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    const maxSpeed = 3
    const normalizedSpeed = Math.min(speed / maxSpeed, 1)
    const hue = 200 - normalizedSpeed * 60
    ctx.fillStyle = `hsl(${hue}, 70%, 55%)`

    ctx.beginPath()
    ctx.arc(p.x, p.y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

// ─── State ───────────────────────────────────────────────────────────────────
interface Particle {
  x: number
  y: number
  vx: number
  vy: number
}

interface State {
  particles: Particle[]
  temperature: number
  running: boolean
  rafId: number | null
  steps: number
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createGasMoleculesPage(): Page {
  const state: State = { particles: [], temperature: 1, running: false, rafId: null, steps: 0 }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnAdd: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let tempSlider: HTMLInputElement
  let elEstimate: HTMLElement
  let elParticles: HTMLElement
  let elAvgSpeed: HTMLElement
  let elError: HTMLElement

  const containerPad = 30

  // ── Draw the container and particles ────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // Draw container
    ctx.strokeStyle = C_WALL
    ctx.lineWidth = 3
    ctx.strokeRect(containerPad, containerPad, W - containerPad * 2, H - containerPad * 2)

    // Draw particles with velocity-based color
    for (const p of state.particles) {
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      const maxSpeed = 5 * Math.sqrt(state.temperature)
      const normalizedSpeed = Math.min(speed / maxSpeed, 1)

      // Color from cool (slow) to hot (fast)
      const hue = 200 - normalizedSpeed * 60 // Blue to purple/red
      ctx.fillStyle = `hsl(${hue}, 70%, 55%)`

      ctx.beginPath()
      ctx.arc(p.x, p.y, PARTICLE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw histogram of speeds
    drawHistogram()
  }

  // ── Draw speed histogram ────────────────────────────────────────────────────
  function drawHistogram(): void {
    if (state.particles.length < 5) return

    const W = canvas.width
    const histH = 60
    const histY = canvas.height - 70
    const histX = containerPad

    // Calculate speeds
    const speeds = state.particles.map(p =>
      Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    )

    // Create histogram bins
    const maxSpeed = Math.max(...speeds, 5)
    const numBins = 20
    const binWidth = maxSpeed / numBins
    const bins = Array(numBins).fill(0)

    for (const s of speeds) {
      const bin = Math.min(Math.floor(s / binWidth), numBins - 1)
      bins[bin]++
    }

    const maxBin = Math.max(...bins, 1)
    const barWidth = (W - containerPad * 2) / numBins

    // Draw histogram bars
    ctx.fillStyle = C_PARTICLE
    ctx.globalAlpha = 0.5
    for (let i = 0; i < numBins; i++) {
      const h = (bins[i] / maxBin) * histH
      ctx.fillRect(histX + i * barWidth, histY + histH - h, barWidth - 1, h)
    }
    ctx.globalAlpha = 1

    // Draw Maxwell-Boltzmann reference
    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 2
    ctx.beginPath()

    for (let i = 0; i <= numBins; i++) {
      const v = (i / numBins) * maxSpeed
      // 2D Maxwell-Boltzmann: f(v) = (v/T) * exp(-v²/(2T)) for normalized distribution
      const fv = (v / state.temperature) * Math.exp(-v * v / (2 * state.temperature))
      const maxFv = 1 / (state.temperature * Math.sqrt(Math.E)) // Peak value
      const normalizedFv = fv / maxFv
      const y = histY + histH - normalizedFv * histH
      const x = histX + i * barWidth

      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // ── Estimate π from Maxwell-Boltzmann speed distribution ─────────────────────
  function estimatePi(): number {
    if (state.particles.length < 10) return 0

    // Calculate mean speed
    let avgSpeed = 0
    for (const p of state.particles) {
      avgSpeed += Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    }
    avgSpeed /= state.particles.length

    // For 2D Maxwell-Boltzmann: <v> = √(πT/2)
    // So: π = 2<v>²/T
    const piEstimate = (2 * avgSpeed * avgSpeed) / state.temperature

    return piEstimate
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = estimatePi()
    const error = Math.abs(piEstimate - Math.PI)

    let avgSpeed = 0
    for (const p of state.particles) {
      avgSpeed += Math.sqrt(p.vx * p.vx + p.vy * p.vy)
    }
    avgSpeed /= state.particles.length || 1

    elEstimate.textContent = state.particles.length < 10 ? '—' : fmt(piEstimate)
    elParticles.textContent = state.particles.length.toLocaleString()
    elAvgSpeed.textContent = avgSpeed.toFixed(2)

    if (state.particles.length >= 10) {
      elError.textContent = `Error: ${fmt(error)}`
      elError.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
    } else {
      elError.textContent = 'Error: —'
      elError.className = 'stat-error neutral'
    }
  }

  // ── Add a particle with random velocity based on temperature ──────────────────
  function addParticle(): void {
    const W = canvas.width - containerPad * 2 - PARTICLE_RADIUS * 2
    const H = canvas.height - containerPad * 2 - PARTICLE_RADIUS * 2

    // Maxwell-Boltzmann uses Gaussian velocity components
    const sigma = Math.sqrt(state.temperature)
    const vx = gaussianRandom() * sigma
    const vy = gaussianRandom() * sigma

    state.particles.push({
      x: containerPad + PARTICLE_RADIUS + Math.random() * W,
      y: containerPad + PARTICLE_RADIUS + Math.random() * H,
      vx, vy
    })
  }

  // ─── Gaussian random number using Box-Muller transform ───────────────────────
  function gaussianRandom(): number {
    const u1 = Math.random()
    const u2 = Math.random()
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  }

  // ── Physics simulation step ─────────────────────────────────────────────────
  function physicsStep(): void {
    const minX = containerPad + PARTICLE_RADIUS
    const maxX = canvas.width - containerPad - PARTICLE_RADIUS
    const minY = containerPad + PARTICLE_RADIUS
    const maxY = canvas.height - containerPad - PARTICLE_RADIUS

    // Velocity scaling for thermalization
    const targetSigma = Math.sqrt(state.temperature)

    for (const p of state.particles) {
      // Update position
      p.x += p.vx
      p.y += p.vy

      // Wall collisions (elastic)
      if (p.x < minX) { p.x = minX; p.vx = Math.abs(p.vx) }
      if (p.x > maxX) { p.x = maxX; p.vx = -Math.abs(p.vx) }
      if (p.y < minY) { p.y = minY; p.vy = Math.abs(p.vy) }
      if (p.y > maxY) { p.y = maxY; p.vy = -Math.abs(p.vy) }

      // Gentle thermalization toward temperature
      if (state.steps % 10 === 0) {
        const currentSigma = Math.sqrt((p.vx * p.vx + p.vy * p.vy) / 2)
        const scale = 0.99 + 0.01 * (targetSigma / (currentSigma + 0.1))
        p.vx *= scale
        p.vy *= scale
      }
    }

    // Particle-particle collisions (simplified)
    for (let i = 0; i < state.particles.length; i++) {
      for (let j = i + 1; j < state.particles.length; j++) {
        const p1 = state.particles[i]
        const p2 = state.particles[j]
        const dx = p2.x - p1.x
        const dy = p2.y - p1.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        if (dist < PARTICLE_RADIUS * 2 + 1) {
          // Elastic collision
          const dvx = p1.vx - p2.vx
          const dvy = p1.vy - p2.vy
          const dvDotDr = dvx * dx + dvy * dy

          if (dvDotDr > 0) { // Approaching
            const scale = dvDotDr / (dist * dist)
            p1.vx -= scale * dx
            p1.vy -= scale * dy
            p2.vx += scale * dx
            p2.vy += scale * dy
          }
        }
      }
    }

    state.steps++
  }

  // ── Animation tick ───────────────────────────────────────────────────────────
  function tick(): void {
    if (!state.running) return

    for (let i = 0; i < TICKS_PER_FRAME; i++) {
      physicsStep()
    }

    draw()
    updateStats()
    state.rafId = requestAnimationFrame(tick)
  }

  function start(): void {
    if (state.particles.length === 0) {
      addParticles(50)
    }
    state.running = true
    btnStart.disabled = true
    btnReset.disabled = false
    btnStart.textContent = 'Running…'
    state.rafId = requestAnimationFrame(tick)
  }

  function addParticles(count: number): void {
    for (let i = 0; i < count && state.particles.length < MAX_PARTICLES; i++) {
      addParticle()
    }
    draw()
    updateStats()
  }

  function reset(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
    state.particles = []
    state.steps = 0
    draw()
    updateStats()
    btnStart.disabled = false
    btnStart.textContent = 'Start'
    btnReset.disabled = true
  }

  function updateTemperature(): void {
    state.temperature = parseFloat(tempSlider.value) || 1
    updateStats()
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method ${getMethodIndex('gas-molecules')}</span>
        <h2 class="page-title">Gas Molecules</h2>
        <p class="page-subtitle">
          Maxwell-Boltzmann speed distribution relates to π.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="gm-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="gm-start" class="btn primary">Start</button>
            <button id="gm-add" class="btn">+10 Particles</button>
            <button id="gm-reset" class="btn" disabled>Reset</button>
            <label style="margin-left:10px; color:var(--text-secondary)">
              Temp:
              <input type="range" id="gm-temp" min="0.2" max="3" step="0.1" value="1"
                     style="width:80px; vertical-align:middle">
              <span id="gm-temp-val">1.0</span>
            </label>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate 2&lt;v&gt;²/T</div>
            <div class="stat-value large" id="gm-estimate">—</div>
            <div class="stat-error neutral" id="gm-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Particles</div>
            <div class="stat-value" id="gm-particles">0</div>
            <div class="stat-sub">of ${MAX_PARTICLES} max</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Average speed &lt;v&gt;</div>
            <div class="stat-value" id="gm-avg-speed">—</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_PARTICLE}"></div>
              Gas particles
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}"></div>
              Maxwell-Boltzmann curve
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">&lt;v&gt; = √(πT/2)</div>
            <p>
              In an ideal gas, the Maxwell-Boltzmann speed distribution
              gives the mean speed as √(πT/2) in normalized units.
            </p>
            <p>
              By simulating particles and measuring their average speed,
              we can estimate π: π = 2&lt;v&gt;²/T, where T is temperature.
            </p>
            <p>
              The histogram shows the actual speed distribution compared
              to the theoretical Maxwell-Boltzmann curve.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#gm-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#gm-start', HTMLButtonElement)
    btnAdd = queryRequired(page, '#gm-add', HTMLButtonElement)
    btnReset = queryRequired(page, '#gm-reset', HTMLButtonElement)
    tempSlider = queryRequired(page, '#gm-temp', HTMLInputElement)
    elEstimate = queryRequired(page, '#gm-estimate')
    elParticles = queryRequired(page, '#gm-particles')
    elAvgSpeed = queryRequired(page, '#gm-avg-speed')
    elError = queryRequired(page, '#gm-error')

    const tempVal = queryRequired(page, '#gm-temp-val')

    ctx = getCanvasContext2D(canvas)
    draw()
    updateStats()

    btnStart.addEventListener('click', () => {
      if (!state.running) start()
    })
    btnAdd.addEventListener('click', () => {
      addParticles(10)
      btnReset.disabled = false
    })
    btnReset.addEventListener('click', reset)
    tempSlider.addEventListener('input', () => {
      tempVal.textContent = tempSlider.value
      updateTemperature()
    })

    return page
  }

  function cleanup(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  }

  return { render, cleanup }
}
