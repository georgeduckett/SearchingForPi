// ─── Wallis Product Page ──────────────────────────────────────────────────────
// Main page factory for the Wallis product method.

import { fmt } from '../../utils'
import { getInsideColor, getOutsideColor, getAmberColor, CANVAS_SIZE } from '../../colors'
import { createMethodPageFactory, statCard, legend, explanation } from '../base/page'
import { State, MAX_FACTORS, getFactor, estimatePi, createInitialState } from './types'
import { draw } from './rendering'

// Method-specific colors for UI
const C_OVER = getInsideColor()
const C_UNDER = getOutsideColor()

// ─── Page Factory ────────────────────────────────────────────────────────────
export const createWallisPage = createMethodPageFactory<State>(
  {
    title: 'Wallis Product',
    subtitle: 'An infinite product that converges to π/2.',
    index: '10',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Add Factor</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate (2×product)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Current product', 'product', { subtext: '→ π/2 ≈ 1.5708' })}
      ${statCard('Factors computed', 'factors', { subtext: `of ${MAX_FACTORS} max` })}
      ${legend([
        { color: C_OVER, text: 'Over π/2' },
        { color: C_UNDER, text: 'Under π/2' },
        { color: getAmberColor(), text: 'Target π/2' },
      ])}
      ${explanation(
        'How it works',
        [
          'Discovered by John Wallis in 1655, this infinite product represents π/2 as an elegant alternating product of fractions.',
          'Each odd-numbered factor (2n/(2n-1)) is greater than 1 and temporarily pushes the product above π/2. Each even-numbered factor (2n/(2n+1)) brings it back below. This oscillation gradually dampens as the product converges.',
        ],
        'π/2 = (2/1)·(2/3)·(4/3)·…'
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
      const elFactors = $id('factors', HTMLElement)
      const elProduct = $id('product', HTMLElement)
      const elError = $id('error', HTMLElement)

      function updateStats(): void {
        const piEstimate = estimatePi(state.product)
        const error = Math.abs(piEstimate - Math.PI)

        elEstimate.textContent = fmt(piEstimate)
        elFactors.textContent = state.factors.toLocaleString()
        elProduct.textContent = fmt(state.product)
        elError.textContent = `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
      }

      function addFactor(): void {
        state.factors++
        state.product *= getFactor(state.factors)

        draw(ctx2d, state)
        updateStats()
        if (state.factors >= MAX_FACTORS) {
          stop()
        }
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.intervalId = setInterval(addFactor, 50)
      }

      function stop(): void {
        state.running = false
        if (state.intervalId !== null) {
          clearInterval(state.intervalId)
          state.intervalId = null
        }
        btnStart.disabled = state.factors >= MAX_FACTORS
        btnStart.textContent = state.factors >= MAX_FACTORS ? 'Done' : 'Start'
      }

      function reset(): void {
        stop()
        state.factors = 0
        state.product = 1
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
          addFactor()
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
