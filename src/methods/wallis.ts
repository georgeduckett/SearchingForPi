import type { Page } from '../router'
import { fmt, queryRequired } from '../utils'
import { C_BG, C_INSIDE, C_OUTSIDE, C_AMBER, C_TEXT_MUTED, CANVAS_SIZE } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const MAX_TERMS = 100

// Method-specific colors
const C_OVER = C_INSIDE
const C_UNDER = C_OUTSIDE

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  terms: number
  product: number
  running: boolean
  intervalId: ReturnType<typeof setInterval> | null
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createWallisPage(): Page {
  const state: State = { terms: 0, product: 1, running: false, intervalId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep: HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elTerms: HTMLElement
  let elProduct: HTMLElement
  let elError: HTMLElement

  // ── Draw the product visualization ─────────────────────────────────────────
  function draw(): void {
    const W = canvas.width
    const H = canvas.height

    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, W, H)

    // Reference line at π/2
    const target = Math.PI / 2
    const maxVal = 4 // Scale for visualization
    const pad = 50
    const plotH = H - pad * 2
    const plotW = W - pad * 2
    const baseY = pad + plotH
    const scale = plotH / maxVal

    // Grid lines
    ctx.strokeStyle = '#333'
    ctx.lineWidth = 1
    for (let i = 0; i <= 8; i++) {
      const y = pad + (plotH * i) / 8
      ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(W - pad, y); ctx.stroke()
    }

    // π/2 reference line
    const piY = baseY - target * scale
    ctx.strokeStyle = C_AMBER
    ctx.lineWidth = 2
    ctx.setLineDash([8, 4])
    ctx.beginPath()
    ctx.moveTo(pad, piY)
    ctx.lineTo(W - pad, piY)
    ctx.stroke()
    ctx.setLineDash([])

    // Label
    ctx.fillStyle = C_TEXT_MUTED
    ctx.font = '11px "JetBrains Mono", monospace'
    ctx.fillText('π/2 ≈ 1.5708', W - pad - 80, piY - 5)

    // Draw bars showing alternation
    if (state.terms > 0) {
      const barW = Math.min(8, plotW / MAX_TERMS)
      let currentProduct = 1

      for (let n = 1; n <= state.terms; n++) {
        const term1 = (2 * n) / (2 * n - 1)
        const term2 = (2 * n) / (2 * n + 1)
        currentProduct *= term1 * term2

        const x = pad + (n / MAX_TERMS) * plotW
        const deviation = currentProduct - target
        const isOver = currentProduct > target

        // Draw bar showing deviation from target
        const barY = piY
        const barH = Math.abs(deviation) * scale * 2 // Amplify for visibility

        ctx.fillStyle = isOver ? C_OVER : C_UNDER
        ctx.globalAlpha = 0.7
        if (isOver) {
          ctx.fillRect(x - barW / 2, barY - barH, barW, barH)
        } else {
          ctx.fillRect(x - barW / 2, barY, barW, barH)
        }
        ctx.globalAlpha = 1
      }
    }

    // Current product indicator
    if (state.terms > 0) {
      const x = pad + (state.terms / MAX_TERMS) * plotW
      ctx.strokeStyle = '#fff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.moveTo(x, baseY)
      ctx.lineTo(x, baseY - state.product * scale)
      ctx.stroke()

      // Dot at current value
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(x, baseY - state.product * scale, 4, 0, Math.PI * 2)
      ctx.fill()
    }

    // Axis
    ctx.strokeStyle = C_TEXT_MUTED
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(pad, baseY)
    ctx.lineTo(W - pad, baseY)
    ctx.stroke()

    // Y-axis
    ctx.beginPath()
    ctx.moveTo(pad, pad)
    ctx.lineTo(pad, baseY)
    ctx.stroke()
  }

  // ── Update stats display ────────────────────────────────────────────────────
  function updateStats(): void {
    const piEstimate = 2 * state.product
    const error = Math.abs(piEstimate - Math.PI)

    elEstimate.textContent = fmt(piEstimate)
    elTerms.textContent = state.terms.toLocaleString()
    elProduct.textContent = fmt(state.product)
    elError.textContent = `Error: ${fmt(error)}`
    elError.className = 'stat-error ' + (error < 0.1 ? 'improving' : 'neutral')
  }

  function addTerm(): void {
    state.terms++
    const n = state.terms
    const term1 = (2 * n) / (2 * n - 1)
    const term2 = (2 * n) / (2 * n + 1)
    state.product *= term1 * term2

    draw()
    updateStats()
    if (state.terms >= MAX_TERMS) {
      stop()
    }
  }

  function start(): void {
    state.running = true
    btnStart.disabled = true
    btnStart.textContent = 'Running…'
    state.intervalId = setInterval(addTerm, 80)
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
    state.product = 1
    draw()
    updateStats()
    btnStart.disabled = false
    btnStart.textContent = 'Start'
    btnReset.disabled = true
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 10</span>
        <h2 class="page-title">Wallis Product</h2>
        <p class="page-subtitle">
          An infinite product that converges to π/2.
        </p>
      </header>

      <div class="viz-layout">
        <div>
          <div class="canvas-wrapper">
            <canvas id="wa-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="wa-start" class="btn primary">Start</button>
            <button id="wa-step" class="btn">Add Term</button>
            <button id="wa-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate (2×product)</div>
            <div class="stat-value large" id="wa-estimate">—</div>
            <div class="stat-error neutral" id="wa-error">Error: —</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Current product</div>
            <div class="stat-value" id="wa-product">1</div>
            <div class="stat-sub">→ π/2 ≈ 1.5708</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Terms computed</div>
            <div class="stat-value" id="wa-terms">0</div>
            <div class="stat-sub">of ${MAX_TERMS} max</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_OVER}"></div>
              Over π/2
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_UNDER}"></div>
              Under π/2
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_AMBER}"></div>
              Target π/2
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <div class="formula">π/2 = ∏(2n/(2n-1) × 2n/(2n+1))</div>
            <p>
              Discovered by John Wallis in 1655, this infinite product
              represents π/2 as an elegant alternating product of fractions.
            </p>
            <p>
              Each term multiplies by (2n/(2n-1)) × (2n/(2n+1)), which
              oscillates above and below π/2 while slowly converging.
            </p>
          </div>
        </div>
      </div>
    `

    canvas = queryRequired(page, '#wa-canvas', HTMLCanvasElement)
    btnStart = queryRequired(page, '#wa-start', HTMLButtonElement)
    btnStep = queryRequired(page, '#wa-step', HTMLButtonElement)
    btnReset = queryRequired(page, '#wa-reset', HTMLButtonElement)
    elEstimate = queryRequired(page, '#wa-estimate')
    elTerms = queryRequired(page, '#wa-terms')
    elProduct = queryRequired(page, '#wa-product')
    elError = queryRequired(page, '#wa-error')

    ctx = canvas.getContext('2d')!
    draw()
    updateStats()

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

    return page
  }

  function cleanup(): void {
    if (state.intervalId !== null) clearInterval(state.intervalId)
    state.running = false
  }

  return { render, cleanup }
}
