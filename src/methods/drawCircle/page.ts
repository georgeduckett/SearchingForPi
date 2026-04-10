// ─── Draw Circle Page ────────────────────────────────────────────────────────
// Main page factory for the draw circle method.

import { CANVAS_SIZE } from '../../colors'
import {
  createMethodPageFactory,
  statCard,
  legend,
  explanation,
  cleanupController,
} from '../base/page'
import {
  State,
  C_DRAWN,
  C_APPROX,
  C_CENTER,
  C_RADIUS,
  C_PERFECT,
  createInitialState,
} from './types'
import { createDrawCircleController, StatsElements } from './controller'

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createDrawCirclePage = createMethodPageFactory<State>(
  {
    title: 'Draw a Circle',
    subtitle: 'Approximate π by manually drawing a circle and measuring its perimeter.',
    index: '07',
    canvasWidth: CANVAS_SIZE,
    canvasHeight: CANVAS_SIZE,
    controls: `
      <div style="display:flex;flex-direction:column;gap:8px;flex:1;">
        <label style="font-family:var(--font-mono);font-size:0.65rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);">
          Line segment length: <span id="length-val">50px</span>
        </label>
        <input type="range" id="length-slider" min="5" max="100" value="50" step="5" style="width:100%;cursor:pointer;">
      </div>
      <button class="btn" id="btn-clear">Clear</button>
    `,
    statsPanel: `
      <div class="stat-card">
        <div class="stat-label">π approximation</div>
        <div class="stat-value large" id="approx" style="color:${C_APPROX}">—</div>
        <div class="stat-error neutral" id="error">—</div>
      </div>
      ${statCard('Points drawn', 'points')}
      <div class="stat-card">
        <div class="stat-label">Perimeter (C)</div>
        <div class="stat-value" id="perimeter" style="color:${C_DRAWN}">—</div>
        <div class="stat-sub">Sum of all line segments</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Radius</div>
        <div class="stat-value" id="radius" style="color:${C_RADIUS}">—</div>
        <div class="stat-sub">Average distance to center</div>
      </div>
      ${legend([
        { color: C_DRAWN, text: 'Your circle (using straight lines)' },
        { color: C_PERFECT, text: 'Perfect circle (same center/radius)' },
        { color: C_CENTER, text: 'Center (average of all points)' },
        { color: C_RADIUS, text: 'Radius (from center to first point)' },
      ])}
      ${explanation(
        'How it works',
        [
          'Draw a circle by clicking and dragging. Your circle is made of straight lines that connect the points you create. This means we know its exact length. The center is calculated as the average of all your points, with the radius being the average distance from that center.',
          'The better your circle, the closer your approximation will be to π. Using smaller line segments gives smoother circles and better accuracy.',
        ],
        'π ≈ perimeter / (2 × r)'
      )}
    `,
  },
  createInitialState(),
  {
    init(ctx) {
      const { $id } = ctx

      // Get stats element references
      const statsElements: StatsElements = {
        points: $id('points', HTMLElement),
        perimeter: $id('perimeter', HTMLElement),
        radius: $id('radius', HTMLElement),
        approx: $id('approx', HTMLElement),
        error: $id('error', HTMLElement),
      }

      // Create and store the controller
      const controller = createDrawCircleController(ctx, statsElements)

      // Store controller for cleanup
      ctx.state._controller = controller
    },

    draw(_ctx) {
      // Drawing is handled in init and mouse events
    },

    cleanup(ctx) {
      cleanupController(ctx.state)
    },
  }
)
