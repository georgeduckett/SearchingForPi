// ─── Archimedes Page ─────────────────────────────────────────────────────────
// Main page factory for the Archimedes polygons method.

import { CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import { State, createInitialState } from './types'
import { createArchimedesController, StatsElements } from './controller'
import { C_POLYGON_INNER, C_POLYGON_OUTER, C_CIRCLE } from './rendering'

// ─── Page Factory ────────────────────────────────────────────────────────────
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
      ${explanation(
        'How it works',
        [
          'Archimedes (≈250 BCE) approximated π by drawing regular polygons inside and outside a unit circle.',
          'Starting with a hexagon (6 sides), each iteration doubles the number of sides. The polygons increasingly approximate the circle, squeezing π into an ever-narrower range.',
          'With just 96 sides, Archimedes bounded π between 3.1408 and 3.1429 — an accuracy that stood for centuries.',
        ],
        'n·sin(π/n) ≤ π ≤ n·tan(π/n)'
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
        error: $id('error', HTMLElement),
        sides: $id('sides', HTMLElement),
        lower: $id('lower', HTMLElement),
        upper: $id('upper', HTMLElement),
        gap: $id('gap', HTMLElement),
      }

      // Create and store the controller
      const controller = createArchimedesController(ctx, statsElements)

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
