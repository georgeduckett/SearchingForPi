import type { Page } from '../router'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_SIZE = 560
const MAX_ITERATIONS = 9  // Start with 6 sides, double up to 6 * 2^9 = 3072

// ─── Colours ─────────────────────────────────────────────────────────────────
const C_POLYGON_INNER = '#4a9eff'
const C_POLYGON_OUTER = '#ff9f69'
const C_CIRCLE = '#c8922a'
const C_BG = '#13161f'
const C_GRID = '#1a1e2b'

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  sides: number
  iteration: number
  lower: number  // Inscribed polygon perimeter
  upper: number  // Circumscribed polygon perimeter
  animating: boolean
  targetSides: number
  progress: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(n: number, digits = 10): string {
  return n.toFixed(digits)
}

function calculateBounds(sides: number, diameter = 1): { lower: number, upper: number } {
  // For a circle with diameter 1:
  // Inscribed polygon perimeter = sides * sin(π/sides)
  // Circumscribed polygon perimeter = sides * tan(π/sides)
  const angle = Math.PI / sides
  return {
    lower: sides * Math.sin(angle),
    upper: sides * Math.tan(angle)
  }
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createArchimedesPage(): Page {
  const state: State = {
    sides: 6,       // Start with hexagon
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

    // Draw unit circle (the reference)
    ctx.strokeStyle = C_CIRCLE
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.stroke()

    // Draw inscribed polygon (lower bound - fits inside circle)
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

    // Draw circumscribed polygon (upper bound - encloses circle)
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

    // Draw vertices for visual clarity
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

    const gap = state.upper - state.lower
    const digits = Math.min(12, 4 + state.iteration)

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

    // Interpolate values
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

    // Start with initial calculation
    const initialBounds = calculateBounds(6)
    state.lower = initialBounds.lower
    state.upper = initialBounds.upper

    let options = ''
    for (let i = 0; i <= MAX_ITERATIONS; i++) {
      const sides = 6 * Math.pow(2, i)
      const label = i === 0 ? `${sides} sides` : `${sides} sides`
      options += `<option value="${i}">${label}</option>`
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
            <div class="stat-label">Polygon sides</div>
            <div class="stat-value large" id="arch-sides">6 sides</div>
            <div class="stat-sub">Iteration ${0} of ${MAX_ITERATIONS}</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Lower bound (inscribed)</div>
            <div class="stat-value" id="arch-lower" style="color:${C_POLYGON_INNER}">0.0000000000</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Upper bound (circumscribed)</div>
            <div class="stat-value" id="arch-upper" style="color:${C_POLYGON_OUTER}">0.0000000000</div>
            <div class="stat-sub" id="arch-gap">Gap: —</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_POLYGON_INNER}"></div>
              Inscribed polygon (π ≥ this)
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_POLYGON_OUTER}"></div>
              Circumscribed polygon (π ≤ this)
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

    // Grab element refs
    canvas = page.querySelector<HTMLCanvasElement>('#arch-canvas')!
    btnStep = page.querySelector<HTMLButtonElement>('#arch-step')!
    btnPlay = page.querySelector<HTMLButtonElement>('#arch-play')!
    btnReset = page.querySelector<HTMLButtonElement>('#arch-reset')!
    selectIter = page.querySelector<HTMLSelectElement>('#arch-select')!
    elSides = page.querySelector('#arch-sides')!
    elLower = page.querySelector('#arch-lower')!
    elUpper = page.querySelector('#arch-upper')!
    elGap = page.querySelector('#arch-gap')!

    ctx = canvas.getContext('2d')!
    updateStats()
    draw(6, state.lower, state.upper)

    btnStep.addEventListener('click', step)
    btnPlay.addEventListener('click', play)
    btnReset.addEventListener('click', reset)
    selectIter.addEventListener('change', (e) => {
      const iter = parseInt((e.target as HTMLSelectElement).value)
      const sides = 6 * Math.pow(2, iter)
      const subElement = page.querySelector('.stat-sub')!
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