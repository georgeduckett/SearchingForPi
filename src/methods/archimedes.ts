import { fmt } from '../utils'
import { C_INSIDE, C_AMBER, CANVAS_SIZE, PREVIEW_SIZE, C_OUTSIDE } from '../colors'
import { clearCanvas, drawGrid, drawCircle, drawRegularPolygon } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

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

  clearCanvas(ctx, s, s)

  const sides = 6 + Math.floor(time * 0.2) % 4 * 2
  drawRegularPolygon(ctx, cx, cy, r, sides, C_INSIDE, 1.5)

  const r2 = r / Math.cos(Math.PI / sides)
  drawRegularPolygon(ctx, cx, cy, r2, sides, C_OUTSIDE, 1.5)

  drawCircle(ctx, cx, cy, r, C_AMBER, 1)
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
  animationId: number | null
  startLower: number
  startUpper: number
  endLower: number
  endUpper: number
  startSides: number
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
export const createArchimedesPage = createMethodPageFactory<State>(
  {
    title: "Archimedes' Polygons",
    subtitle: 'Squeeze π between inscribed and circumscribed regular polygons.',
    index: '06',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-step">Double Sides</button>
      <button class="btn" id="btn-play">Auto Play</button>
      <button class="btn" id="btn-reset">Reset</button>
      <select id="select-iter" class="control-select">
        <option value="0">6 sides</option>
        <option value="1">12 sides</option>
        <option value="2">24 sides</option>
        <option value="3">48 sides</option>
        <option value="4">96 sides</option>
        <option value="5">192 sides</option>
        <option value="6">384 sides</option>
        <option value="7">768 sides</option>
        <option value="8">1536 sides</option>
        <option value="9">3072 sides</option>
      </select>
    `,
    statsPanel: `
      ${statCard('π estimate (average)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      <div class="stat-card">
        <div class="stat-label">Upper bound (circumscribed)</div>
        <div class="stat-value" id="upper" style="color:${C_POLYGON_OUTER}">0.0000000000</div>
        <div class="stat-sub" id="gap">Gap: —</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Lower bound (inscribed)</div>
        <div class="stat-value" id="lower" style="color:${C_POLYGON_INNER}">0.0000000000</div>
      </div>
      ${statCard('Polygon sides', 'sides')}
      ${legend([
        { color: C_POLYGON_OUTER, text: 'Circumscribed polygon (π ≤ this)' },
        { color: C_POLYGON_INNER, text: 'Inscribed polygon (π ≥ this)' },
        { color: C_CIRCLE, text: 'Unit circle (π = this)' },
      ])}
      ${explanation('How it works', [
        'Archimedes (≈250 BCE) approximated π by drawing regular polygons inside and outside a unit circle.',
        'Starting with a hexagon (6 sides), each iteration doubles the number of sides. The polygons increasingly approximate the circle, squeezing π into an ever-narrower range.',
        'With just 96 sides, Archimedes bounded π between 3.1408 and 3.1429 — an accuracy that stood for centuries.',
      ], 'n·sin(π/n) ≤ π ≤ n·tan(π/n)')}
    `,
  },
  {
    sides: 6,
    iteration: 0,
    lower: 0,
    upper: 0,
    animating: false,
    targetSides: 6,
    progress: 0,
    animationId: null,
    startLower: 0,
    startUpper: 0,
    endLower: 0,
    endUpper: 0,
    startSides: 6,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx

      // Get button references
      const btnStep = $id('btn-step', HTMLButtonElement)
      const btnPlay = $id('btn-play', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const selectIter = $id('select-iter', HTMLSelectElement)
      const elSides = $id('sides', HTMLElement)
      const elLower = $id('lower', HTMLElement)
      const elUpper = $id('upper', HTMLElement)
      const elGap = $id('gap', HTMLElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Initialize bounds
      const initialBounds = calculateBounds(6)
      state.lower = initialBounds.lower
      state.upper = initialBounds.upper

      // Draw function
      function draw(currentSides: number, currentLower: number, currentUpper: number): void {
        const s = CANVAS_SIZE
        const centerX = s / 2
        const centerY = s / 2
        const radius = Math.min(centerX, centerY) - 40

        clearCanvas(ctx2d, s, s)
        drawGrid(ctx2d, s, s)

        // Draw unit circle
        ctx2d.strokeStyle = C_CIRCLE
        ctx2d.lineWidth = 2
        ctx2d.beginPath()
        ctx2d.arc(centerX, centerY, radius, 0, Math.PI * 2)
        ctx2d.stroke()

        // Draw inscribed polygon (lower bound)
        const innerScale = radius * (currentLower / Math.PI)
        ctx2d.strokeStyle = C_POLYGON_INNER
        ctx2d.lineWidth = 2
        ctx2d.beginPath()
        for (let i = 0; i <= currentSides; i++) {
          const angle = (i * 2 * Math.PI / currentSides) - Math.PI / 2
          const x = centerX + innerScale * Math.cos(angle)
          const y = centerY + innerScale * Math.sin(angle)
          if (i === 0) ctx2d.moveTo(x, y)
          else ctx2d.lineTo(x, y)
        }
        ctx2d.stroke()

        // Draw circumscribed polygon (upper bound)
        const outerScale = radius * (currentUpper / Math.PI)
        ctx2d.strokeStyle = C_POLYGON_OUTER
        ctx2d.lineWidth = 2
        ctx2d.setLineDash([5, 5])
        ctx2d.beginPath()
        for (let i = 0; i <= currentSides; i++) {
          const angle = (i * 2 * Math.PI / currentSides) - Math.PI / 2
          const x = centerX + outerScale * Math.cos(angle)
          const y = centerY + outerScale * Math.sin(angle)
          if (i === 0) ctx2d.moveTo(x, y)
          else ctx2d.lineTo(x, y)
        }
        ctx2d.stroke()
        ctx2d.setLineDash([])

        // Draw vertices
        ctx2d.fillStyle = C_POLYGON_INNER
        for (let i = 0; i < currentSides; i++) {
          const angle = (i * 2 * Math.PI / currentSides) - Math.PI / 2
          const x = centerX + innerScale * Math.cos(angle)
          const y = centerY + innerScale * Math.sin(angle)
          ctx2d.beginPath()
          ctx2d.arc(x, y, 3, 0, Math.PI * 2)
          ctx2d.fill()
        }
      }

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
          state.animationId = null
          return
        }

        state.progress += 0.04

        const currentLower = state.startLower + (state.endLower - state.startLower) * state.progress
        const currentUpper = state.startUpper + (state.endUpper - state.startUpper) * state.progress
        const currentSides = state.startSides + (state.targetSides - state.startSides) * state.progress

        draw(currentSides, currentLower, currentUpper)

        state.animationId = requestAnimationFrame(animateTransition)
      }

      function stepTo(sides: number): void {
        if (state.animating) return

        state.startSides = state.sides
        state.startLower = state.lower
        state.startUpper = state.upper

        const newBounds = calculateBounds(sides)
        state.targetSides = sides
        state.endLower = newBounds.lower
        state.endUpper = newBounds.upper

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
        if (state.animationId !== null) cancelAnimationFrame(state.animationId)
        state.sides = 6
        state.iteration = 0
        state.animating = false
        state.targetSides = 6
        state.progress = 0
        state.animationId = null
        updateStats()
        draw(6, state.lower, state.upper)
        selectIter.value = '0'
        btnPlay.disabled = false
        btnStep.disabled = false
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

      // Initial draw
      updateStats()
      draw(6, state.lower, state.upper)

      // Wire up buttons
      btnStep.addEventListener('click', step)
      btnPlay.addEventListener('click', play)
      btnReset.addEventListener('click', reset)
      selectIter.addEventListener('change', (e) => {
        const iter = parseInt((e.target as HTMLSelectElement).value)
        const sides = 6 * Math.pow(2, iter)
        stepTo(sides)
      })
    },

    cleanup(ctx) {
      if (ctx.state.animationId !== null) {
        cancelAnimationFrame(ctx.state.animationId)
        ctx.state.animationId = null
      }
      ctx.state.animating = false
    },
  }
)
