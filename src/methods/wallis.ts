import { fmt } from '../utils'
import { C_BG, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas, drawDashedLine, drawText } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_FACTORS = 200

// Method-specific colors
const C_OVER = C_INSIDE
const C_UNDER = C_OUTSIDE

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const terms = 6
  const barW = (s - 20) / terms
  for (let i = 0; i < terms; i++) {
    const n = i + 1
    const val = (2 * n) / (2 * n - 1) * (2 * n) / (2 * n + 1)
    const h = val * 20 + Math.sin(time * 0.6 + i * 0.5) * 5
    ctx.fillStyle = i % 2 === 0 ? C_INSIDE : C_AMBER
    ctx.globalAlpha = 0.7
    ctx.fillRect(10 + i * barW, s / 2 - h, barW - 3, h * 2)
  }
  ctx.globalAlpha = 1

  ctx.fillStyle = C_AMBER
  ctx.font = '11px monospace'
  ctx.textAlign = 'center'
  ctx.fillText('→ π/2', s / 2, 15)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  factors: number // Number of factors computed (each term-pair has 2 factors)
  product: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Helper Functions ────────────────────────────────────────────────────────

// Get the n-th factor value (1-indexed)
// Odd factors: (2k+2)/(2k+1) > 1, where k = (n-1)/2
// Even factors: (2k+2)/(2k+3) < 1, where k = (n-2)/2
function getFactor(n: number): number {
  const k = Math.floor((n - 1) / 2)
  if (n % 2 === 1) {
    // Odd factor: (2(k+1))/(2(k+1)-1) = (2k+2)/(2k+1)
    return (2 * (k + 1)) / (2 * (k + 1) - 1)
  } else {
    // Even factor: (2k+2)/(2k+3)
    return (2 * (k + 1)) / (2 * (k + 1) + 1)
  }
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
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
        { color: C_AMBER, text: 'Target π/2' },
      ])}
      ${explanation('How it works', [
        'Discovered by John Wallis in 1655, this infinite product represents π/2 as an elegant alternating product of fractions.',
        'Each odd-numbered factor (2n/(2n-1)) is greater than 1 and temporarily pushes the product above π/2. Each even-numbered factor (2n/(2n+1)) brings it back below. This oscillation gradually dampens as the product converges.',
      ], 'π/2 = (2/1)·(2/3)·(4/3)·…')}
    `,
  },
  {
    factors: 0,
    product: 1,
    running: false,
    intervalId: null,
  },
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

      // Draw function
      function draw(): void {
        const W = CANVAS_SIZE
        const H = CANVAS_SIZE

        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, W, H)

        // Reference line at π/2
        const target = Math.PI / 2
        const maxVal = 4 // Scale for visualization
        const pad = 50
        const plotH = H - pad * 2
        const plotW = W - pad * 2
        const baseY = pad + plotH
        const scale = plotH / maxVal

        // Grid lines
        ctx2d.strokeStyle = '#333'
        ctx2d.lineWidth = 1
        for (let i = 0; i <= 8; i++) {
          const y = pad + (plotH * i) / 8
          ctx2d.beginPath(); ctx2d.moveTo(pad, y); ctx2d.lineTo(W - pad, y); ctx2d.stroke()
        }

        // π/2 reference line
        const piY = baseY - target * scale
        drawDashedLine(ctx2d, pad, piY, W - pad, piY, C_AMBER, 2, [8, 4])

        // Label
        drawText(ctx2d, 'π/2 ≈ 1.5708', W - pad - 80, piY - 5, C_TEXT_MUTED, '11px "JetBrains Mono", monospace')

        // Draw bars showing deviation at each factor step
        if (state.factors > 0) {
          const barW = Math.min(4, plotW / MAX_FACTORS)
          let currentProduct = 1

          for (let n = 1; n <= state.factors; n++) {
            currentProduct *= getFactor(n)
            const x = pad + (n / MAX_FACTORS) * plotW
            const deviation = currentProduct - target
            const isOver = currentProduct > target

            // Draw bar showing deviation from target
            const barY = piY
            const barH = Math.abs(deviation) * scale * 3 // Amplify for visibility

            ctx2d.fillStyle = isOver ? C_OVER : C_UNDER
            ctx2d.globalAlpha = 0.7
            if (isOver) {
              ctx2d.fillRect(x - barW / 2, barY - barH, barW, barH)
            } else {
              ctx2d.fillRect(x - barW / 2, barY, barW, barH)
            }
            ctx2d.globalAlpha = 1
          }
        }

        // Current product indicator
        if (state.factors > 0) {
          const x = pad + (state.factors / MAX_FACTORS) * plotW
          ctx2d.strokeStyle = '#fff'
          ctx2d.lineWidth = 2
          ctx2d.beginPath()
          ctx2d.moveTo(x, baseY)
          ctx2d.lineTo(x, baseY - state.product * scale)
          ctx2d.stroke()

          // Dot at current value
          ctx2d.fillStyle = '#fff'
          ctx2d.beginPath()
          ctx2d.arc(x, baseY - state.product * scale, 4, 0, Math.PI * 2)
          ctx2d.fill()
        }

        // Axis
        ctx2d.strokeStyle = C_TEXT_MUTED
        ctx2d.lineWidth = 1.5
        ctx2d.beginPath()
        ctx2d.moveTo(pad, baseY)
        ctx2d.lineTo(W - pad, baseY)
        ctx2d.stroke()

        // Y-axis
        ctx2d.beginPath()
        ctx2d.moveTo(pad, pad)
        ctx2d.lineTo(pad, baseY)
        ctx2d.stroke()
      }

      function updateStats(): void {
        const piEstimate = 2 * state.product
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

        draw()
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
        draw()
        updateStats()
        btnStart.disabled = false
        btnStart.textContent = 'Start'
        btnReset.disabled = true
      }

      // Initial draw
      draw()
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
