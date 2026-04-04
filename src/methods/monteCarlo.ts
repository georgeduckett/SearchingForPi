import { fmt } from '../utils'
import { C_INSIDE, C_OUTSIDE, C_AMBER, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas, drawGrid, drawCircle, isInsideCircle, fillCircle } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const DOTS_PER_TICK = 30
const MAX_DOTS = 20_000
const DOT_RADIUS = 1.2
const DOT_ALPHA = 0.7
const PREVIEW_DOT_RADIUS = 1.5
const CIRCLE_RADIUS_FACTOR = 0.5 // r = s * CIRCLE_RADIUS_FACTOR

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  // Circle outline
  drawCircle(ctx, s / 2, s / 2, s / 2 - 4, C_AMBER, 1)

  // Dots with stable pseudo-random positions
  ctx.globalAlpha = DOT_ALPHA
  for (let i = 0; i < 60; i++) {
    const x = 4 + (Math.sin(i * 1.1) * 0.5 + 0.5) * (s - 8)
    const y = 4 + (Math.cos(i * 1.3) * 0.5 + 0.5) * (s - 8)
    const inside = isInsideCircle(x, y, s / 2, s / 2, s / 2 - 4)
    fillCircle(ctx, x, y, PREVIEW_DOT_RADIUS, inside ? C_INSIDE : C_OUTSIDE)
  }
  ctx.globalAlpha = 1
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  inside: number
  total: number
  running: boolean
  rafId: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function estimatePi(inside: number, total: number): number {
  return total === 0 ? 0 : (4 * inside) / total
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createMonteCarloPage = createMethodPageFactory<State>(
  {
    title: 'Monte Carlo',
    subtitle: 'Random sampling reveals structure — and π.',
    index: '01',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Add 10</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large', errorId: 'error', progressId: 'progress' })}
      ${statCard('Points plotted', 'total', { subtext: `of ${MAX_DOTS.toLocaleString()} total` })}
      ${legend([
        { color: C_INSIDE, text: 'Inside circle' },
        { color: C_OUTSIDE, text: 'Outside circle' },
      ])}
      ${explanation('How it works', [
        'We scatter random points inside a unit square that contains an inscribed circle of radius ½.',
        'Because the area of the circle is πr² and the square is (2r)², the probability of a random point landing inside the circle is π/4.',
        'The more points we sample, the closer our estimate converges to π — but the convergence is slow: halving the error requires quadrupling the samples.',
      ], 'π ≈ 4 × (inside / total)')}
    `,
  },
  {
    inside: 0,
    total: 0,
    running: false,
    rafId: null,
  },
  {
    init(ctx) {
      const { ctx: ctx2d, state, $id } = ctx
      
      // Get button references
      const btnStart = $id('btn-start', HTMLButtonElement)
      const btnStep = $id('btn-step', HTMLButtonElement)
      const btnReset = $id('btn-reset', HTMLButtonElement)
      const elEstimate = $id('estimate', HTMLElement)
      const elTotal = $id('total', HTMLElement)
      const elError = $id('error', HTMLElement)
      const elProgress = $id('progress', HTMLElement)

      // Draw initial background
      drawBackground(ctx2d)

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (state.total >= MAX_DOTS) {
          resetState()
        }
        start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          addDots(ctx2d, state, 10)
          updateStats(state, elEstimate, elTotal, elError, elProgress)
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', resetState)

      function drawBackground(c: CanvasRenderingContext2D): void {
        const s = CANVAS_SIZE
        const r = s * CIRCLE_RADIUS_FACTOR
        clearCanvas(c, s, s)
        drawGrid(c, s, s)
        drawCircle(c, r, r, r, C_AMBER, 1.5)
      }

      function addDots(c: CanvasRenderingContext2D, s: State, count: number): void {
        const size = CANVAS_SIZE
        const r = size * CIRCLE_RADIUS_FACTOR
        c.globalAlpha = DOT_ALPHA
        for (let i = 0; i < count; i++) {
          const x = Math.random() * size
          const y = Math.random() * size
          const isInside = isInsideCircle(x, y, r, r, r)
          if (isInside) s.inside++
          s.total++
          fillCircle(c, x, y, DOT_RADIUS, isInside ? C_INSIDE : C_OUTSIDE)
        }
        c.globalAlpha = 1
        // Re-draw circle on top so it stays crisp
        drawCircle(c, r, r, r, C_AMBER, 1.5)
      }

      function updateStats(s: State, est: HTMLElement, tot: HTMLElement, err: HTMLElement, prog: HTMLElement): void {
        const pi = estimatePi(s.inside, s.total)
        est.textContent = fmt(pi)
        tot.textContent = s.total.toLocaleString()
        const error = Math.abs(pi - Math.PI)
        err.textContent = `Error: ${fmt(error)}`
        err.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
        const pct = Math.min((s.total / MAX_DOTS) * 100, 100)
        prog.style.width = `${pct}%`
      }

      function tick(): void {
        if (!state.running) return
        if (state.total >= MAX_DOTS) {
          state.running = false
          btnStart.textContent = 'Restart'
          btnStart.disabled = false
          return
        }
        addDots(ctx2d, state, Math.min(DOTS_PER_TICK, MAX_DOTS - state.total))
        updateStats(state, elEstimate, elTotal, elError, elProgress)
        state.rafId = requestAnimationFrame(tick)
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnStart.textContent = 'Running…'
        btnReset.disabled = false
        state.rafId = requestAnimationFrame(tick)
      }

      function resetState(): void {
        state.running = false
        if (state.rafId !== null) {
          cancelAnimationFrame(state.rafId)
          state.rafId = null
        }
        state.inside = 0
        state.total = 0
        drawBackground(ctx2d)
        updateStats(state, elEstimate, elTotal, elError, elProgress)
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnReset.disabled = true
      }
    },

    draw(_ctx) {
      // Drawing is handled in init and animation loop
    },

    cleanup(ctx) {
      ctx.state.running = false
      if (ctx.state.rafId !== null) {
        cancelAnimationFrame(ctx.state.rafId)
        ctx.state.rafId = null
      }
    },
  }
)
