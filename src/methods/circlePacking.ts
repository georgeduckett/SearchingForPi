import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_INSIDE, C_TEXT_MUTED, CANVAS_SIZE } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_CIRCLES = 500
const MIN_RADIUS = 8
const MAX_RADIUS = 25
const ATTEMPTS_PER_CIRCLE = 100

// ─── State ───────────────────────────────────────────────────────────────────
interface Circle {
  x: number
  y: number
  r: number
  color: string
}

interface State {
  circles: Circle[]
  rejected: number
  running: boolean
  rafId: number | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createCirclePackingPage(): Page {
  const state: State = { circles: [], rejected: 0, running: false, rafId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elCircles: HTMLElement
  let elCovered: HTMLElement
  let elError: HTMLElement

  const padding = 20

  // ── Check if circle overlaps with existing circles ───────────────────────────
  function overlaps(x: number, y: number, r: number): boolean {
    for (const c of state.circles) {
      const dx = x - c.x
      const dy = y - c.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < r + c.r + 2) return true
    }
    return false
  }

  // ── Draw the circle packing ────────────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // Draw bounding square
    ctx.strokeStyle = C_TEXT_MUTED
    ctx.lineWidth = 1
    ctx.strokeRect(padding, padding, W - padding * 2, H - padding * 2)

    // Draw circles
    for (const circle of state.circles) {
      ctx.fillStyle = circle.color
      ctx.beginPath()
      ctx.arc(circle.x, circle.y, circle.r, 0, Math.PI * 2)
      ctx.fill()

      // Subtle outline
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'
      ctx.lineWidth = 1
      ctx.stroke()
    }
  }

  // ── Estimate π from circle areas ────────────────────────────────────────────
  function estimatePi(): number {
    if (state.circles.length === 0) return 0

    // Sum of r² for all circles
    const sumRSquared = state.circles.reduce((sum, c) => sum + c.r * c.r, 0)

    // Calculate actual covered area (accounting for overlap approximation)
    // For non-overlapping circles: covered_area = π × Σr²
    // So π ≈ covered_area / Σr²

    const W = canvas.width - padding * 2
    const H = canvas.height - padding * 2

    // Approximate covered area by counting pixels or using bounding box
    // For simplicity, use Monte Carlo within square
    let coveredPixels = 0
    const samples = 10000
    for (let i = 0; i < samples; i++) {
      const x = padding + Math.random() * W
      const y = padding + Math.random() * H
      for (const c of state.circles) {
        const dx = x - c.x
        const dy = y - c.y
        if (dx * dx + dy * dy <= c.r * c.r) {
          coveredPixels++
          break
        }
      }
    }

    const coveredFraction = coveredPixels / samples
    const coveredArea = coveredFraction * W * H

    // π = covered_area / Σr² (since covered_area = π × Σr² for non-overlapping)
    return coveredArea / sumRSquared
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = estimatePi()
    const error = Math.abs(piEstimate - Math.PI)

    const totalArea = (canvas.width - padding * 2) * (canvas.height - padding * 2)
    let circleArea = 0
    for (const c of state.circles) {
      circleArea += Math.PI * c.r * c.r
    }
    const coverage = (circleArea / totalArea) * 100

    elEstimate.textContent = state.circles.length < 5 ? '—' : fmt(piEstimate)
    elCircles.textContent = state.circles.length.toLocaleString()
    elCovered.textContent = `${coverage.toFixed(1)}%`
    if (state.circles.length >= 5) {
      elError.textContent = `Error: ${fmt(error)}`
      elError.className = 'stat-error ' + (error < 0.5 ? 'improving' : 'neutral')
    } else {
      elError.textContent = 'Error: —'
      elError.className = 'stat-error neutral'
    }
  }

  // ── Add a circle via random sequential adsorption ─────────────────────────────
  function addCircle(): boolean {
    const W = canvas.width - padding * 2
    const H = canvas.height - padding * 2

    for (let attempt = 0; attempt < ATTEMPTS_PER_CIRCLE; attempt++) {
      const r = MIN_RADIUS + Math.random() * (MAX_RADIUS - MIN_RADIUS)
      const x = padding + r + Math.random() * (W - 2 * r)
      const y = padding + r + Math.random() * (H - 2 * r)

      if (!overlaps(x, y, r)) {
        // Generate color based on radius
        const hue = 200 + ((r - MIN_RADIUS) / (MAX_RADIUS - MIN_RADIUS)) * 40
        state.circles.push({
          x, y, r,
          color: `hsl(${hue}, 65%, 55%)`
        })
        return true
      }
    }
    return false
  }

  // ── Add multiple circles ────────────────────────────────────────────────────
  function addCircles(count: number): void {
    for (let i = 0; i < count && state.circles.length < MAX_CIRCLES; i++) {
      if (!addCircle()) {
        state.rejected++
        // Stop if too many rejections (jamming limit)
        if (state.rejected > 10) break
      }
    }
    draw()
    updateStats()
  }

  function tick(): void {
    if (!state.running) return
    if (state.circles.length >= MAX_CIRCLES || state.rejected > 50) {
      state.running = false
      btnStart.textContent = 'Done'
      btnStart.disabled = true
      return
    }
    addCircles(3)
    state.rafId = requestAnimationFrame(tick)
  }

  function start(): void {
    state.running = true
    state.rejected = 0
    btnStart.disabled = true
    btnReset.disabled = false
    btnStart.textContent = 'Running…'
    state.rafId = requestAnimationFrame(tick)
  }

  function reset(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
    state.circles = []
    state.rejected = 0
    draw()
    updateStats()
    btnStart.disabled = false
    btnStart.textContent = 'Start'
    btnReset.disabled = true
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 13</span>
        <h2 class="page-title">Circle Packing</h2>
        <p class="page-subtitle">
          The area of circles relates to π through covered area.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="cp-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="cp-start" class="btn primary">Start</button>
            <button id="cp-step" class="btn">+3 Circles</button>
            <button id="cp-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate</div>
            <div class="stat-value large" id="cp-estimate">—</div>
            <div class="stat-error neutral" id="cp-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Circles placed</div>
            <div class="stat-value" id="cp-circles">0</div>
            <div class="stat-sub">of ${MAX_CIRCLES} max</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Area coverage</div>
            <div class="stat-value" id="cp-covered">0%</div>
            <div class="stat-sub">jamming limit ~55%</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_INSIDE}"></div>
              Placed circles
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">Area = π × Σr²</div>
            <p>
              We place circles randomly without overlap (random sequential
              adsorption). The covered area equals π times the sum of
              squared radii (for non-overlapping circles).
            </p>
            <p>
              By measuring the actual covered area and dividing by Σr²,
              we can estimate the value of π.
            </p>
            <p>
              The maximum packing density (jamming limit) for random
              circle placement is approximately 54.7%.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#cp-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#cp-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#cp-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#cp-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#cp-estimate')
    elCircles = queryRequired(page, '#cp-circles')
    elCovered = queryRequired(page, '#cp-covered')
    elError = queryRequired(page, '#cp-error')

    ctx = canvas.getContext('2d')!
    draw()
    updateStats()

    btnStart.addEventListener('click', () => {
      if (!state.running && state.circles.length < MAX_CIRCLES) start()
    })
    btnStep.addEventListener('click', () => {
      if (!state.running) {
        addCircles(3)
        btnReset.disabled = false
      }
    })
    btnReset.addEventListener('click', reset)

    return page
  }

  function cleanup(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  }

  return { render, cleanup }
}
