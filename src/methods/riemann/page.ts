// ─── Riemann Page ────────────────────────────────────────────────────────────
// Main page factory for the Riemann integral method.

import { fmt } from '../../utils'
import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import { State, MAX_RECTS, createInitialState, computeSum } from './types'
import { draw } from './rendering'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createRiemannPage = createMethodPageFactory<State>(
  {
    title: 'Riemann Integral',
    subtitle: 'The area under 4/(1+x²) from 0 to 1 equals π.',
    index: '08',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">+5 Rectangles</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate (integral)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Rectangles', 'rects', { subtext: `of ${MAX_RECTS.toLocaleString()} max` })}
      ${legend([
        { color: getInsideColor(), text: 'Riemann rectangles' },
        { color: getAmberColor(), text: 'Curve y = 4/(1+x²)' },
      ])}
      ${explanation(
        'How it works',
        [
          'The integral of 4/(1+x²) from 0 to 1 equals exactly π. This is because the antiderivative is 4·arctan(x), and arctan(1) - arctan(0) = π/4.',
          'Riemann sums approximate this integral by dividing the area into rectangles. As the number of rectangles increases, the sum converges to π.',
        ],
        '∫₀¹ 4/(1+x²) dx = π'
      )}
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
      const elRects = $id('rects', HTMLElement)
      const elError = $id('error', HTMLElement)

      function updateStats(): void {
        const estimate = computeSum(state.rects)
        const error = Math.abs(estimate - Math.PI)

        elEstimate.textContent = fmt(estimate)
        elRects.textContent = state.rects.toLocaleString()
        elError.textContent = `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
      }

      function addRects(count: number): void {
        state.rects = Math.min(state.rects + count, MAX_RECTS)
        draw(ctx2d, state)
        updateStats()
        if (state.rects >= MAX_RECTS) {
          stop()
        }
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.intervalId = setInterval(() => addRects(5), 100)
      }

      function stop(): void {
        state.running = false
        if (state.intervalId !== null) {
          clearInterval(state.intervalId)
          state.intervalId = null
        }
        btnStart.disabled = state.rects >= MAX_RECTS
        btnStart.textContent = state.rects >= MAX_RECTS ? 'Done' : 'Start'
      }

      function reset(): void {
        stop()
        state.rects = 0
        draw(ctx2d, state)
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      // Initial draw
      draw(ctx2d, state)
      updateStats()

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (!state.running) start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          addRects(5)
          btnReset.disabled = false
        }
      })

      btnReset.addEventListener('click', reset)
    },

    cleanup(ctx) {
      if (ctx.state.intervalId !== null) {
        clearInterval(ctx.state.intervalId)
        ctx.state.intervalId = null
      }
      ctx.state.running = false
    },
  }
)
