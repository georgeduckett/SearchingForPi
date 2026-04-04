import { fmt } from '../utils'
import { C_BG, C_GRID, C_INSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE, PREVIEW_SIZE } from '../colors'
import { clearCanvas } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_RECTS = 200

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, _time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 1.5
  ctx.beginPath()
  for (let x = 0; x <= s - 10; x++) {
    const nx = x / (s - 10)
    const y = 4 / (1 + nx * nx)
    const py = s - 10 - (y / 4) * (s - 20)
    if (x === 0) ctx.moveTo(x + 10, py)
    else ctx.lineTo(x + 10, py)
  }
  ctx.stroke()

  ctx.fillStyle = C_INSIDE
  ctx.globalAlpha = 0.5
  const n = 8
  for (let i = 0; i < n; i++) {
    const x0 = 10 + (i / n) * (s - 20)
    const w = (s - 20) / n
    const nx = i / n
    const y = 4 / (1 + nx * nx)
    const h = (y / 4) * (s - 20)
    ctx.fillRect(x0, s - 10 - h, w - 1, h)
  }
  ctx.globalAlpha = 1
}

// ─── The function: f(x) = 4/(1+x²), integral from 0 to 1 = π ─────────────────
function f(x: number): number {
  return 4 / (1 + x * x)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  rects: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

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
        { color: C_INSIDE, text: 'Riemann rectangles' },
        { color: C_AMBER, text: 'Curve y = 4/(1+x²)' },
      ])}
      ${explanation('How it works', [
        'The integral of 4/(1+x²) from 0 to 1 equals exactly π. This is because the antiderivative is 4·arctan(x), and arctan(1) - arctan(0) = π/4.',
        'Riemann sums approximate this integral by dividing the area into rectangles. As the number of rectangles increases, the sum converges to π.',
      ], '∫₀¹ 4/(1+x²) dx = π')}
    `,
  },
  {
    rects: 0,
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
      const elRects = $id('rects', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Draw function
      function draw(): void {
        const W = CANVAS_SIZE
        const H = CANVAS_SIZE
        const pad = 40
        const plotW = W - pad * 2
        const plotH = H - pad * 2

        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, W, H)

        // Grid
        ctx2d.strokeStyle = C_GRID
        ctx2d.lineWidth = 1
        for (let i = 0; i <= 10; i++) {
          const x = pad + (plotW * i) / 10
          const y = pad + (plotH * i) / 10
          ctx2d.beginPath(); ctx2d.moveTo(x, pad); ctx2d.lineTo(x, H - pad); ctx2d.stroke()
          ctx2d.beginPath(); ctx2d.moveTo(pad, y); ctx2d.lineTo(W - pad, y); ctx2d.stroke()
        }

        // Draw rectangles (Riemann sum)
        if (state.rects > 0) {
          const n = state.rects
          const dx = 1 / n
          ctx2d.fillStyle = C_INSIDE
          ctx2d.globalAlpha = 0.6

          for (let i = 0; i < n; i++) {
            const x0 = i * dx
            const y = f(x0) // left endpoint
            const screenX = pad + (x0 * plotW)
            const screenW = (dx * plotW)
            const screenH = (y / 4) * plotH
            ctx2d.fillRect(screenX, H - pad - screenH, screenW, screenH)
          }
          ctx2d.globalAlpha = 1
        }

        // Draw the curve
        ctx2d.strokeStyle = C_AMBER
        ctx2d.lineWidth = 2.5
        ctx2d.beginPath()
        for (let i = 0; i <= plotW; i++) {
          const x = i / plotW
          const y = f(x)
          const screenX = pad + i
          const screenY = H - pad - (y / 4) * plotH
          if (i === 0) ctx2d.moveTo(screenX, screenY)
          else ctx2d.lineTo(screenX, screenY)
        }
        ctx2d.stroke()

        // Axes
        ctx2d.strokeStyle = C_TEXT_MUTED
        ctx2d.lineWidth = 1.5
        ctx2d.beginPath()
        ctx2d.moveTo(pad, pad); ctx2d.lineTo(pad, H - pad); ctx2d.lineTo(W - pad, H - pad); ctx2d.stroke()

        // Labels
        ctx2d.fillStyle = C_TEXT_MUTED
        ctx2d.font = '12px "JetBrains Mono", monospace'
        ctx2d.fillText('0', pad - 12, H - pad + 15)
        ctx2d.fillText('1', W - pad - 5, H - pad + 15)
        ctx2d.fillText('4', pad - 20, pad + 5)
        ctx2d.fillText('y = 4/(1+x²)', W - pad - 95, pad + 20)
      }

      // Compute Riemann sum
      function computeSum(): number {
        if (state.rects === 0) return 0
        const n = state.rects
        const dx = 1 / n
        let sum = 0
        for (let i = 0; i < n; i++) {
          sum += f(i * dx) * dx
        }
        return sum
      }

      function updateStats(): void {
        const estimate = computeSum()
        const error = Math.abs(estimate - Math.PI)

        elEstimate.textContent = fmt(estimate)
        elRects.textContent = state.rects.toLocaleString()
        elError.textContent = `Error: ${fmt(error)}`
        elError.className = 'stat-error ' + (error < 0.01 ? 'improving' : 'neutral')
      }

      function addRects(count: number): void {
        state.rects = Math.min(state.rects + count, MAX_RECTS)
        draw()
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
