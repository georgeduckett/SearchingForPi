// ─── Monte Carlo Page ────────────────────────────────────────────────────────
// Main page factory for the Monte Carlo method.

import { fmt } from '../../utils'
import { C_INSIDE, C_OUTSIDE, CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, createFrameAnimation, cancelAnimations, statCard, legend, explanation } from '../base/page'
import { State, DOTS_PER_TICK, MAX_DOTS, createInitialState } from './types'
import { estimatePi, generatePoint } from './sampling'
import { drawBackground, drawPoint } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
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
  createInitialState(),
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

      // Stats update helper
      function updateStats(): void {
        const pi = estimatePi(state.inside, state.total)
        elEstimate.textContent = fmt(pi)
        elTotal.textContent = state.total.toLocaleString()
        const error = Math.abs(pi - Math.PI)
        elError.textContent = `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
        const pct = Math.min((state.total / MAX_DOTS) * 100, 100)
        elProgress.style.width = `${pct}%`
      }

      // Add dots helper
      function addDots(count: number): void {
        for (let i = 0; i < count; i++) {
          const point = generatePoint()
          if (point.isInside) state.inside++
          state.total++
          drawPoint(ctx2d, point.x, point.y, point.isInside)
        }
      }

      // Create animation loop
      const animation = createFrameAnimation(ctx, {
        update(state, _dt) {
          if (state.total >= MAX_DOTS) {
            state.running = false
            return
          }
          addDots(Math.min(DOTS_PER_TICK, MAX_DOTS - state.total))
        },
        draw(_ctx) {
          updateStats()
        },
        isRunning: (state) => state.running,
        onComplete() {
          btnStart.textContent = 'Restart'
          btnStart.disabled = false
        },
      })

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (state.total >= MAX_DOTS) {
          resetState()
        }
        start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          addDots(10)
          updateStats()
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', resetState)

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnStart.textContent = 'Running…'
        btnReset.disabled = false
        animation.start()
        state.rafId = animation.getFrameId()
      }

      function resetState(): void {
        animation.stop()
        state.inside = 0
        state.total = 0
        state.rafId = null
        drawBackground(ctx2d)
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnReset.disabled = true
      }
    },

    draw(_ctx) {
      // Drawing is handled in init and animation loop
    },

    cleanup(ctx) {
      cancelAnimations(ctx.state)
    },
  }
)
