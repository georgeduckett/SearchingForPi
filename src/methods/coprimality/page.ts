// ─── Coprimality Page ────────────────────────────────────────────────────────
// Main page factory for the coprimality method.

import { CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, MAX_PAIRS, C_COPRIME, C_NOT_COPRIME, createInitialState } from './types'
import { createCoprimalityController, StatsElements } from './controller'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createCoprimalityPage = createMethodPageFactory<State>(
  {
    title: 'Coprimality',
    subtitle: 'Two random numbers are coprime with probability 6/π².',
    index: '11',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">+20 Pairs</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate √(6/P)', 'estimate', { valueClass: 'stat-value large', errorId: 'error' })}
      ${statCard('Pairs tested', 'pairs', { subtext: `of ${MAX_PAIRS.toLocaleString()} max` })}
      ${statCard('Coprime pairs', 'coprime', { subtext: '→ ~60.8% expected' })}
      ${legend([
        { color: C_COPRIME, text: 'Coprime (GCD = 1)' },
        { color: C_NOT_COPRIME, text: 'Not coprime (GCD > 1)' },
      ])}
      ${explanation(
        'How it works',
        [
          'Two random positive integers are coprime (share no common factors other than 1) with probability 6/π².',
          'By generating many random pairs and counting coprimes, we can estimate π: π ≈ √(6 / P(coprime)).',
          "The grid visualizes pairs by their values modulo 50, coloring each by whether they're coprime.",
        ],
        'P(coprime) = 6/π² ≈ 0.6079'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $id } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        estimate: $id('estimate', HTMLElement),
        pairs: $id('pairs', HTMLElement),
        coprime: $id('coprime', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createCoprimalityController(ctx, statsElements)

      // Store controller for cleanup
      ctx.state._controller = controller
    },

    draw(_ctx) {
      // Drawing is handled in init and animation loop
    },

    cleanup(ctx) {
      cleanupController(ctx.state)
    },
  }
)
