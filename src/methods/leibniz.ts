import type { Page } from '../router'
import { queryRequired } from '../utils'
import { C_BG, C_GRID, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, C_BORDER, PREVIEW_SIZE } from '../colors'

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
  ctx.fillStyle = C_BG
  ctx.fillRect(0, 0, s, s)

  const terms = 10
  const barW = (s - 20) / terms
  for (let i = 0; i < terms; i++) {
    const sign = i % 2 === 0 ? 1 : -1
    const term = sign / (2 * i + 1)
    const h = Math.abs(term) * (s - 30) * 2
    ctx.fillStyle = i % 2 === 0 ? C_INSIDE : C_OUTSIDE
    ctx.globalAlpha = 0.7 + 0.15 * Math.sin(time * 0.5 + i * 0.3)
    ctx.fillRect(10 + i * barW, s / 2 - h / 2, barW - 2, h)
  }
  ctx.globalAlpha = 1

  const pi4 = (s - 30) * (Math.PI / 4)
  ctx.strokeStyle = C_AMBER
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(10, s / 2 - pi4 / 2)
  ctx.lineTo(s - 10, s / 2 - pi4 / 2)
  ctx.stroke()
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
export function createLeibnizPage(): Page {
  const state: State = { terms: [], running: false, termIndex: 0, intervalId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let elEstimate: HTMLElement
  let elTerms: HTMLElement
  let elCurrentTerm: HTMLElement
  let elError: HTMLElement

  // ── Draw the bar chart ────────────────────────────────────────────────────
  function draw(): void {
    const W = CANVAS_W
    const H = CANVAS_H
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    const n = state.terms.length
    if (n === 0) {
      // Just a zero line
      ctx.strokeStyle = C_ZERO
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, H / 2)
      ctx.lineTo(W, H / 2)
      ctx.stroke()
      return
    }

    // Determine visible window
    const visible = Math.min(n, 80)
    const startIdx = Math.max(0, n - visible)
    const barW = W / visible
    const midY = H / 2

    // Grid lines at π and -π reference
    ctx.strokeStyle = C_GRID
    ctx.lineWidth = 1
    ;[0.25, 0.5, 0.75, 1].forEach(f => {
      ctx.beginPath(); ctx.moveTo(0, H * f); ctx.lineTo(W, H * f); ctx.stroke()
    })

    // Zero line
    ctx.strokeStyle = C_ZERO
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(W, midY)
    ctx.stroke()

    // Draw bars for each term's contribution
    const scale = (H * 0.4)
    for (let i = 0; i < visible; i++) {
      const idx = startIdx + i
      if (idx === 0) continue
      const term = leibnizTerm(idx)
      const isPos = term > 0
      const barH = Math.abs(term) * scale * 10

      ctx.fillStyle = isPos ? C_PLUS : C_MINUS
      ctx.globalAlpha = 0.5
      const x = i * barW
      if (isPos) {
        ctx.fillRect(x, midY - barH, barW - 1, barH)
      } else {
        ctx.fillRect(x, midY, barW - 1, barH)
      }
    }
    ctx.globalAlpha = 1

    // Draw the running π estimate as a line
    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 2
    ctx.beginPath()
    const piScale = (H * 0.4) / Math.PI

    for (let i = 0; i < visible; i++) {
      const idx = startIdx + i
      const piEst = state.terms[idx]
      const y = midY - (piEst - Math.PI) * piScale * 6
      if (i === 0) ctx.moveTo(i * barW, y)
      else ctx.lineTo(i * barW + barW / 2, y)
    }
    ctx.stroke()

    // True π line
    ctx.strokeStyle = C_AMBER
    ctx.globalAlpha = 0.2
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.beginPath()
    ctx.moveTo(0, midY)
    ctx.lineTo(W, midY)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.globalAlpha = 1

    // Axis labels
    ctx.fillStyle = C_TEXT
    ctx.font = `10px "JetBrains Mono", monospace`
    ctx.fillText(`n = ${startIdx}`, 8, H - 8)
    ctx.fillText(`n = ${n - 1}`, W - 50, H - 8)
  }

  // ── Add next term ─────────────────────────────────────────────────────────
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

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 02</span>
        <h2 class="page-title">Leibniz Series</h2>
        <p class="page-subtitle">
          An infinite alternating series with an unexpectedly beautiful limit.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="lb-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="lb-start" class="btn primary">Start</button>
            <button id="lb-step" class="btn">Step</button>
            <button id="lb-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate</div>
            <div class="stat-value large" id="lb-estimate">—</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Error vs true π</div>
            <div class="stat-value" style="font-size:1.4rem" id="lb-error">—</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Terms computed</div>
            <div class="stat-value" id="lb-terms">0</div>
            <div class="stat-sub">of ${MAX_TERMS.toLocaleString()} max</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Current term value</div>
            <div class="stat-value" style="font-size:1.1rem; color: var(--text-secondary)" id="lb-current-term">—</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_PLUS}"></div>
              Positive term (+1/(2n+1))
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_MINUS}"></div>
              Negative term (−1/(2n+1))
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}; border-radius:2px; height:3px"></div>
              Running π estimate
            </div>
          </div>

          <div class="explanation">
            <h3>The Leibniz Formula</h3>
            <div class="formula">π/4 = 1 − 1/3 + 1/5 − 1/7 + …</div>
            <p>
              Discovered by Leibniz in 1676 (and by Madhava two centuries earlier),
              each term alternately overshoots and undershoots π/4. The series
              converges — but slowly. After 500 terms the error is still around 0.002.
            </p>
            <p>
              Use <em>Step</em> to add one term at a time, or <em>Start</em>
              to run automatically.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#lb-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#lb-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#lb-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#lb-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#lb-estimate')
    elTerms = queryRequired(page, '#lb-terms')
    elCurrentTerm = queryRequired(page, '#lb-current-term')
    elError = queryRequired(page, '#lb-error')

    ctx = canvas.getContext('2d')!
    draw()

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

    return page
  }

  function cleanup(): void {
    if (state.intervalId !== null) clearInterval(state.intervalId)
    state.running = false
  }

  return { render, cleanup }
}
