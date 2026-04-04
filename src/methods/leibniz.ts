import { C_BG, C_GRID, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, C_BORDER, PREVIEW_SIZE } from '../colors'
import { clearCanvas, drawLine, drawDashedLine } from './base/canvas'
import { createMethodPageFactory, statCard, legend, explanation } from './base/page'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 560
const CANVAS_H = 320
const MAX_TERMS = 500
const MS_PER_TERM = 40

// Method-specific colors (using shared with local aliases)
const C_PLUS = C_INSIDE
const C_MINUS = C_OUTSIDE
const C_TEXT = C_TEXT_MUTED
const C_ZERO = C_BORDER

// ─── Preview Renderer ────────────────────────────────────────────────────────
export function drawPreview(ctx: CanvasRenderingContext2D, time: number): void {
  const s = PREVIEW_SIZE
  clearCanvas(ctx, s, s)

  const terms = 10
  const barW = (s - 20) / terms
  for (let i = 0; i < terms; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    const term = sign / (2 * i + 1)
    const h = Math.abs(term) * (s - 30) * 2
    ctx.fillStyle = i % 2 === 0 ? C_INSIDE : C_OUTSIDE
    ctx.globalAlpha = 0.7 + 0.15 * Math.sin(time * 0.5 + i * 0.3)
    // Alternate bars above/below the center line
    if (sign > 0) {
      ctx.fillRect(10 + i * barW, s / 2 - h, barW - 2, h)
    } else {
      ctx.fillRect(10 + i * barW, s / 2, barW - 2, h)
    }
  }
  ctx.globalAlpha = 1

  drawLine(ctx, 10, s / 2, s - 10, s / 2, C_AMBER, 2)
}

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  terms: number[]
  running: boolean
  termIndex: number
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Leibniz term: (-1)^n / (2n+1) ──────────────────────────────────────────
function leibnizTerm(n: number): number {
  return (n % 2 === 0 ? 1 : -1) / (2 * n + 1)
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export const createLeibnizPage = createMethodPageFactory<State>(
  {
    title: 'Leibniz Series',
    subtitle: 'An infinite alternating series with an unexpectedly beautiful limit.',
    index: '02',
    canvasWidth: CANVAS_W,
    canvasHeight: CANVAS_H,
    controls: `
      <button class="btn primary" id="btn-start">Start</button>
      <button class="btn" id="btn-step">Step</button>
      <button class="btn" id="btn-reset" disabled>Reset</button>
    `,
    statsPanel: `
      ${statCard('π estimate', 'estimate', { valueClass: 'stat-value large' })}
      <div class="stat-card">
        <div class="stat-label">Error vs true π</div>
        <div class="stat-value" style="font-size:1.4rem" id="error">—</div>
      </div>
      ${statCard('Terms computed', 'terms', { subtext: `of ${MAX_TERMS.toLocaleString()} max` })}
      <div class="stat-card">
        <div class="stat-label">Current term value</div>
        <div class="stat-value" style="font-size:1.1rem; color: var(--text-secondary)" id="current-term">—</div>
      </div>
      ${legend([
        { color: C_PLUS, text: 'Positive term (+1/(2n+1))' },
        { color: C_MINUS, text: 'Negative term (−1/(2n+1))' },
        { color: C_AMBER, text: 'Running π estimate' },
      ])}
      ${explanation('The Leibniz Formula', [
        'Discovered by Leibniz in 1676 (and by Madhava two centuries earlier), each term alternately overshoots and undershoots π/4. The series converges — but slowly. After 500 terms the error is still around 0.002.',
        'Use <em>Step</em> to add one term at a time, or <em>Start</em> to run automatically.',
      ], 'π/4 = 1 − 1/3 + 1/5 − 1/7 + …')}
    `,
  },
  {
    terms: [],
    running: false,
    termIndex: 0,
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
      const elTerms = $id('terms', HTMLElement)
      const elCurrentTerm = $id('current-term', HTMLElement)
      const elError = $id('error', HTMLElement)

      // Draw function
      function draw(): void {
        const W = CANVAS_W
        const H = CANVAS_H
        ctx2d.fillStyle = C_BG
        ctx2d.fillRect(0, 0, W, H)

        const n = state.terms.length
        if (n === 0) {
          // Just a zero line
          ctx2d.strokeStyle = C_ZERO
          ctx2d.lineWidth = 1
          ctx2d.beginPath()
          ctx2d.moveTo(0, H / 2)
          ctx2d.lineTo(W, H / 2)
          ctx2d.stroke()
          return
        }

        // Determine visible window
        const visible = Math.min(n, 80)
        const startIdx = Math.max(0, n - visible)
        const barW = W / visible
        const midY = H / 2

        // Grid lines at π and -π reference
        ctx2d.strokeStyle = C_GRID
        ctx2d.lineWidth = 1
        ;[0.25, 0.5, 0.75, 1].forEach(f => {
          ctx2d.beginPath(); ctx2d.moveTo(0, H * f); ctx2d.lineTo(W, H * f); ctx2d.stroke()
        })

        // Zero line
        ctx2d.strokeStyle = C_ZERO
        ctx2d.lineWidth = 1.5
        ctx2d.beginPath()
        ctx2d.moveTo(0, midY)
        ctx2d.lineTo(W, midY)
        ctx2d.stroke()

        // Draw bars for each term's contribution
        const scale = (H * 0.4)
        for (let i = 0; i < visible; i++) {
          const idx = startIdx + i
          if (idx === 0) continue
          const term = leibnizTerm(idx)
          const isPos = term > 0
          const barH = Math.abs(term) * scale * 10

          ctx2d.fillStyle = isPos ? C_PLUS : C_MINUS
          ctx2d.globalAlpha = 0.5
          const x = i * barW
          if (isPos) {
            ctx2d.fillRect(x, midY - barH, barW - 1, barH)
          } else {
            ctx2d.fillRect(x, midY, barW - 1, barH)
          }
        }
        ctx2d.globalAlpha = 1

        // Draw the running π estimate as a line
        ctx2d.strokeStyle = C_AMBER
        ctx2d.lineWidth = 2
        ctx2d.beginPath()
        const piScale = (H * 0.4) / Math.PI

        for (let i = 0; i < visible; i++) {
          const idx = startIdx + i
          const piEst = state.terms[idx]
          const y = midY - (piEst - Math.PI) * piScale * 6
          if (i === 0) ctx2d.moveTo(i * barW, y)
          else ctx2d.lineTo(i * barW + barW / 2, y)
        }
        ctx2d.stroke()

        // True π line
        ctx2d.globalAlpha = 0.2
        drawDashedLine(ctx2d, 0, midY, W, midY, C_AMBER, 1, [6, 4])
        ctx2d.globalAlpha = 1

        // Axis labels
        ctx2d.fillStyle = C_TEXT
        ctx2d.font = `10px "JetBrains Mono", monospace`
        ctx2d.fillText(`n = ${startIdx}`, 8, H - 8)
        ctx2d.fillText(`n = ${n - 1}`, W - 50, H - 8)
      }

      function updateStats(): void {
        const n = state.terms.length
        if (n === 0) {
          elEstimate.textContent = '—'
          elTerms.textContent = '0'
          elCurrentTerm.textContent = '—'
          elError.textContent = '—'
          return
        }
        const pi = state.terms[n - 1]
        elEstimate.textContent = pi.toFixed(8)
        elTerms.textContent = n.toLocaleString()
        const idx = n - 1
        const rawTerm = leibnizTerm(idx)
        const sign = rawTerm > 0 ? '+' : '-'
        const denom = 2 * idx + 1
        const absTerm = Math.abs(rawTerm)
        elCurrentTerm.textContent = `${sign}1/${denom} = ${sign}${absTerm.toFixed(6)}`
        elError.textContent = Math.abs(pi - Math.PI).toFixed(8)
      }

      function addTerm(): void {
        const n = state.termIndex
        const prev = state.terms.length > 0 ? state.terms[state.terms.length - 1] : 0
        const newSum = prev + leibnizTerm(n) * 4
        state.terms.push(newSum)
        state.termIndex++
        updateStats()
        draw()

        if (state.termIndex >= MAX_TERMS) {
          stop()
        }
      }

      function start(): void {
        state.running = true
        btnStart.disabled = true
        btnStep.disabled = false
        btnReset.disabled = false
        btnStart.textContent = 'Running…'
        state.intervalId = setInterval(addTerm, MS_PER_TERM)
      }

      function stop(): void {
        state.running = false
        if (state.intervalId !== null) {
          clearInterval(state.intervalId)
          state.intervalId = null
        }
        btnStart.disabled = false
        btnStart.textContent = state.termIndex >= MAX_TERMS ? 'Done' : 'Resume'
        if (state.termIndex >= MAX_TERMS) btnStart.disabled = true
      }

      function reset(): void {
        stop()
        state.terms = []
        state.termIndex = 0
        draw()
        updateStats()
        btnStart.textContent = 'Start'
        btnStart.disabled = false
        btnStep.disabled = false
        btnReset.disabled = true
      }

      // Initial draw
      draw()

      // Wire up buttons
      btnStart.addEventListener('click', () => {
        if (!state.running) start()
      })

      btnStep.addEventListener('click', () => {
        if (!state.running) {
          const steps = state.termIndex === 0 ? 2 : 1
          for (let i = 0; i < steps; i++) {
            addTerm()
          }
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
