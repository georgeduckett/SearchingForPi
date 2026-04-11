// ─── Wallis Product Page ──────────────────────────────────────────────────────
// Main page factory for the Wallis product method.

import { getAmberColor, CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, MAX_FACTORS, createInitialState } from './types'
import { createWallisController, StatsElements } from './controller'
import { C_OVER, C_UNDER } from './rendering'

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
      const { $id } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        estimate: $id('estimate', HTMLElement),
        factors: $id('factors', HTMLElement),
        product: $id('product', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createWallisController(ctx, statsElements)

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
