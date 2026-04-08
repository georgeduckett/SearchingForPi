// ─── Basel Problem Page ──────────────────────────────────────────────────────
// Main page factory for the Basel problem method.

import { fmt } from '../../utils'
import { getInsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import { State, MAX_TERMS, estimatePi, createInitialState } from './types'
import { draw } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createBaselPage = createMethodPageFactory<State>(
  {
    title: 'Basel Problem',
    subtitle: 'The sum of reciprocal squares converges to π²/6.',
    index: '09',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Add Term</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate √(6×sum)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Current sum ∑1/n²', 'sum', { subtext: '→ π²/6 ≈ 1.6449' })}
      ${statCard('Terms added', 'terms', { subtext: `of ${MAX_TERMS} max` })}
      ${legend([
        { color: getInsideColor(), text: 'Cumulative sum' },
        { color: getAmberColor(), text: 'Limit π²/6' },
      ])}
      ${explanation(
        'How it works',
        [
          'Euler proved in 1734 that the sum of reciprocal squares equals π²/6. This was a famous open problem known as the Basel Problem.',
          'Each term 1/n² is visualized as a rectangle. The total height of all rectangles approaches π²/6 ≈ 1.6449. Therefore π ≈ √(6 × sum).',
        ],
        '∑₁^∞ 1/n² = π²/6'
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
      const elTerms = $id('terms', HTMLElement)
      const elSum = $id('sum', HTMLElement)
      const elError = $id('error', HTMLElement)

      function updateStats(): void {
        const piEstimate = estimatePi(state.sum)
        const error = Math.abs(piEstimate - Math.PI)

        elEstimate.textContent = fmt(piEstimate)
        elTerms.textContent = state.terms.toLocaleString()
        elSum.textContent = fmt(state.sum)
        elError.textContent = `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
      }

      function addTerm(): void {
        state.terms++
        state.sum += 1 / (state.terms * state.terms)
        draw(ctx2d, state)
        updateStats()
        if (state.terms >= MAX_TERMS) {
          stop()
        }
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.intervalId = setInterval(addTerm, 150)
      }

      function stop(): void {
        state.running = false
        if (state.intervalId !== null) {
          clearInterval(state.intervalId)
          state.intervalId = null
        }
        btnStart.disabled = state.terms >= MAX_TERMS
        btnStart.textContent = state.terms >= MAX_TERMS ? 'Done' : 'Start'
      }

      function reset(): void {
        stop()
        state.terms = 0
        state.sum = 0
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
          addTerm()
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
