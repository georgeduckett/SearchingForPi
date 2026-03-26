import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_GRID, C_INSIDE, C_AMBER, CANVAS_SIZE, PREVIEW_SIZE, C_OUTSIDE } from '../colors'
const MAX_ITERATIONS = 9

// ─── Colours (using shared with method-specific) ─────────────────────────────
const C_POLYGON_INNER = C_INSIDE
const C_POLYGON_OUTER = '#ff9f69'
const C_CIRCLE = C_AMBER

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  const cx = s / 2
  const cy = s / 2
  const r = s / 2 - 10

  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  const sides = 6 + Math.floor(time * 0.2) % 4 * 2
  ctx.strokeStyle = C_INSIDE
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const x = cx + r * Math.cos(angle)
    const y = cy + r * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  const r2 = r / Math.cos(Math.PI / sides)
  ctx.strokeStyle = C_OUTSIDE
  ctx.beginPath()
  for (let i = 0; i <= sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const x = cx + r2 * Math.cos(angle)
    const y = cy + r2 * Math.sin(angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  sides: number
  iteration: number
  lower: number
  upper: number
  animating: boolean
  targetSides: number
  progress: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function calculateBounds(sides: number): { lower: number; upper: number } {
  const angle = Math.PI / sides
  return {
    lower: sides * Math.sin(angle),
    upper: sides * Math.tan(angle)
  }
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createArchimedesPage(): Page {
  const state: State = {
    sides: 6,
    iteration: 0,
    lower: 0,
    upper: 0,
    animating: false,
    targetSides: 6,
    progress: 0
  }

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStep: HTMLButtonElement
  let btnPlay: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elSides: HTMLElement
  let elLower: HTMLElement
  let elUpper: HTMLElement
  let elGap: HTMLElement
  let elEstimate: HTMLElement
  let elError: HTMLElement
  let selectIter: HTMLSelectElement
  let animationId: number | null = null
  let startLower: number = 0
  let startUpper: number = 0
  let endLower: number = 0
  let endUpper: number = 0
  let startSides: number = 6

  // ── Draw the visualization ──────────────────────────────────────────────────
  function draw(currentSides: number, currentLower: number, currentUpper: number): void {
    const s = CANVAS_SIZE
    const centerX = s / 2
    const centerY = s / 2
    const radius = Math.min(centerX, centerY) - 40

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, s, s)

    // Draw grid
    ctx.strokeStyle = C_GRID
    ctx.lineWidth = 1
    for (let x = 0; x <= s; x += s / 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke()
    }
    for (let y = 0; y <= s; y += s / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke()
    }

    // Draw unit circle
    ctx.strokeStyle = C_CIRCLE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw inscribed polygon (lower bound)
    const innerScale = radius * (currentLower / Math.PI)
    ctx.strokeStyle = C_POLYGON_INNER
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i <= currentSides; i++) {
      const angle = (i * 2 * Math.PI / currentSides) - Math.PI / 2
      const x = centerX + innerScale * Math.cos(angle)
      const y = centerY + innerScale * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // Draw circumscribed polygon (upper bound)
    const outerScale = radius * (currentUpper / Math.PI)
    ctx.strokeStyle = C_POLYGON_OUTER
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    for (let i = 0; i <= currentSides; i++) {
      const angle = (i * 2 * Math.PI / currentSides) - Math.PI / 2
      const x = centerX + outerScale * Math.cos(angle)
      const y = centerY + outerScale * Math.sin(angle)
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
    ctx.setLineDash([])

    // Draw vertices
    ctx.fillStyle = C_POLYGON_INNER
    for (let i = 0; i < currentSides; i++) {
      const angle = (i * 2 * Math.PI / currentSides) - Math.PI / 2
      const x = centerX + innerScale * Math.cos(angle)
      const y = centerY + innerScale * Math.sin(angle)
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const currentBounds = calculateBounds(state.sides)
    state.lower = currentBounds.lower
    state.upper = currentBounds.upper

    const estimate = (state.lower + state.upper) / 2
    const error = Math.abs(estimate - Math.PI)
    const gap = state.upper - state.lower
    const digits = Math.min(12, 4 + state.iteration)

    elEstimate.textContent = fmt(estimate)
    elError.textContent = `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
    elSides.textContent = `${state.sides.toLocaleString()} sides`
    elLower.textContent = fmt(state.lower, digits)
    elUpper.textContent = fmt(state.upper, digits)
    elGap.textContent = `Gap: ${fmt(gap, digits)}`
    elGap.style.color = gap < 0.001 ? '#4ecb71' : 'var(--text-muted)'
  }

  // ── Animation between iterations ─────────────────────────────────────────────
  function animateTransition(): void {
    if (state.progress >= 1) {
      state.progress = 0
      state.animating = false
      state.sides = state.targetSides
      updateStats()
      draw(state.sides, state.lower, state.upper)
      btnStep.disabled = false
      btnReset.disabled = false
      btnPlay.disabled = state.iteration >= MAX_ITERATIONS
      selectIter.disabled = false
      animationId = null
      return
    }

    state.progress += 0.04

    const currentLower = startLower + (endLower - startLower) * state.progress
    const currentUpper = startUpper + (endUpper - startUpper) * state.progress
    const currentSides = startSides + (state.targetSides - startSides) * state.progress

    draw(currentSides, currentLower, currentUpper)

    animationId = requestAnimationFrame(animateTransition)
  }

  function stepTo(sides: number): void {
    if (state.animating) return

    startSides = state.sides
    startLower = state.lower
    startUpper = state.upper

    const newBounds = calculateBounds(sides)
    state.targetSides = sides
    endLower = newBounds.lower
    endUpper = newBounds.upper

    state.iteration = Math.log2(sides / 6)
    state.animating = true
    state.progress = 0

    btnStep.disabled = true
    btnReset.disabled = true
    selectIter.disabled = true

    animateTransition()
  }

  function step(): void {
    const nextSides = state.sides * 2
    if (nextSides > 6 * Math.pow(2, MAX_ITERATIONS)) return
    stepTo(nextSides)
  }

  function reset(): void {
    if (animationId !== null) cancelAnimationFrame(animationId)
    state.sides = 6
    state.iteration = 0
    state.animating = false
    state.targetSides = 6
    state.progress = 0
    updateStats()
    draw(6, state.lower, state.upper)
    selectIter.value = '0'
    btnPlay.disabled = false
  }

  function play(): void {
    if (state.animating) return

    const playSequence = () => {
      const nextSides = state.sides * 2
      if (nextSides > 6 * Math.pow(2, MAX_ITERATIONS) || state.iteration >= MAX_ITERATIONS) {
        btnPlay.disabled = true
        return
      }
      stepTo(nextSides)
      setTimeout(() => {
        if (!state.animating && state.iteration < MAX_ITERATIONS) {
          playSequence()
        } else if (state.animating) {
          setTimeout(playSequence, 100)
        }
      }, 600)
    }
    playSequence()
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    const initialBounds = calculateBounds(6)
    state.lower = initialBounds.lower
    state.upper = initialBounds.upper

    let options = ''
    for (let i = 0; i <= MAX_ITERATIONS; i++) {
      const sides = 6 * Math.pow(2, i)
      options += `<option value="${i}">${sides} sides</option>`
    }

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 06</span>
        <h2 class="page-title">Archimedes' Polygons</h2>
        <p class="page-subtitle">
          Squeeze π between inscribed and circumscribed regular polygons.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="arch-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="arch-step" class="btn primary">Double Sides</button>
            <button id="arch-play" class="btn">Auto Play</button>
            <button id="arch-reset" class="btn">Reset</button>
            <select id="arch-select" class="control-select">
              ${options}
            </select>
          </div>
        </div>

        <!-- Stats + info -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate (average)</div>
<div class="stat-value large" id="arch-estimate">0.000000</div>
<div class="stat-error neutral" id="arch-error">Error: —</div>
</div>
<div class="stat-card">
<div class="stat-label">Upper bound (circumscribed)</div>
            <div class="stat-value" id="arch-upper" style="color:${C_POLYGON_OUTER}">0.0000000000</div>
            <div class="stat-sub" id="arch-gap">Gap: —</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Lower bound (inscribed)</div>
            <div class="stat-value" id="arch-lower" style="color:${C_POLYGON_INNER}">0.0000000000</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Polygon sides</div>
            <div class="stat-value" id="arch-sides">6 sides</div>
          </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_POLYGON_OUTER}"></div>
              Circumscribed polygon (π ≤ this)
            </div>
          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_POLYGON_INNER}"></div>
              Inscribed polygon (π ≥ this)
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_CIRCLE}"></div>
              Unit circle (π = this)
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <p>
              Archimedes (≈250 BCE) approximated π by drawing regular polygons
              inside and outside a unit circle.
            </p>
            <div class="formula">n·sin(π/n) ≤ π ≤ n·tan(π/n)</div>
            <p>
              Starting with a hexagon (6 sides), each iteration doubles the number
              of sides. The polygons increasingly approximate the circle, squeezing
              π into an ever-narrower range.
            </p>
            <p>
              With just 96 sides, Archimedes bounded π between 3.1408 and 3.1429
              — an accuracy that stood for centuries.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#arch-canvas', HTMLCanvasElement)
    btnStep = queryRequired(page, '#arch-step', HTMLButtonElement)
    btnPlay = queryRequired(page, '#arch-play', HTMLButtonElement)
    btnReset = queryRequired(page, '#arch-reset', HTMLButtonElement)
    selectIter = queryRequired(page, '#arch-select', HTMLSelectElement)
    elSides = queryRequired(page, '#arch-sides')
    elLower = queryRequired(page, '#arch-lower')
    elUpper = queryRequired(page, '#arch-upper')
    elGap = queryRequired(page, '#arch-gap')
 elEstimate = queryRequired(page, '#arch-estimate')
 elError = queryRequired(page, '#arch-error')

    ctx = canvas.getContext('2d')!
    updateStats()
    draw(6, state.lower, state.upper)

    btnStep.addEventListener('click', step)
    btnPlay.addEventListener('click', play)
    btnReset.addEventListener('click', reset)
    selectIter.addEventListener('change', (e) => {
      const iter = parseInt((e.target as HTMLSelectElement).value)
      const sides = 6 * Math.pow(2, iter)
      const subElement = queryRequired(page, '.stat-sub')
      subElement.textContent = `Iteration ${iter} of ${MAX_ITERATIONS}`
      stepTo(sides)
    })

    return page
  }

  function cleanup(): void {
    if (animationId !== null) cancelAnimationFrame(animationId)
    state.animating = false
  }

  return { render, cleanup }
}
