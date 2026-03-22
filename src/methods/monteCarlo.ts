import type { Page } from '../router'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_SIZE = 560          // logical pixels (square)
const DOTS_PER_TICK = 30         // how many points to add per animation frame
const MAX_DOTS = 20_000

// ─── Colours (pulled from CSS vars at runtime) ───────────────────────────────
const C_INSIDE  = '#4a9eff'
const C_OUTSIDE = '#ff6b6b'
const C_CIRCLE  = '#c8922a'
const C_BG      = '#13161f'
const C_GRID    = '#1a1e2b'

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  inside: number
  total:  number
  running: boolean
  rafId: number | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function estimatePi(inside: number, total: number): number {
  return total === 0 ? 0 : (4 * inside) / total
}

function fmt(n: number, digits = 6): string {
  return n.toFixed(digits)
}

function error(estimate: number): string {
  const e = Math.abs(estimate - Math.PI)
  return e.toFixed(6)
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createMonteCarloPage(): Page {
  const state: State = { inside: 0, total: 0, running: false, rafId: null }
  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let btnStart: HTMLButtonElement
  let btnStep:  HTMLButtonElement
  let btnReset: HTMLButtonElement
  let elEstimate: HTMLElement
  let elTotal: HTMLElement
  let elError: HTMLElement
  let elBar: HTMLElement

  // ── Draw the static background (grid + circle outline) ───────────────────
  function drawBackground(): void {
    const s = CANVAS_SIZE
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, s, s)

    // Faint grid
    ctx.strokeStyle = C_GRID
    ctx.lineWidth = 1
    for (let x = 0; x <= s; x += s / 8) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke()
    }
    for (let y = 0; y <= s; y += s / 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke()
    }

    // Circle outline
    ctx.strokeStyle = C_CIRCLE
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── Add a batch of random dots and draw them ──────────────────────────────
  function addDots(count: number): void {
    const s = CANVAS_SIZE
    const r = s / 2
    for (let i = 0; i < count; i++) {
      const x = Math.random() * s
      const y = Math.random() * s
      const dx = x - r
      const dy = y - r
      const isInside = dx * dx + dy * dy <= r * r
      if (isInside) state.inside++
      state.total++

      ctx.fillStyle = isInside ? C_INSIDE : C_OUTSIDE
      ctx.globalAlpha = 0.7
      ctx.beginPath()
      ctx.arc(x, y, 1.2, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    // Re-draw circle on top so it stays crisp
    ctx.strokeStyle = C_CIRCLE
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.arc(s / 2, s / 2, s / 2, 0, Math.PI * 2)
    ctx.stroke()
  }

  // ── Update the stats panel ────────────────────────────────────────────────
  function updateStats(): void {
    const pi = estimatePi(state.inside, state.total)
    elEstimate.textContent = fmt(pi)
    elTotal.textContent    = state.total.toLocaleString()
    const err = parseFloat(error(pi))
    elError.textContent    = `Error: ${fmt(err)}`
    elError.className      = 'stat-error ' + (err < 0.01 ? 'improving' : 'neutral')
    const pct = Math.min((state.total / MAX_DOTS) * 100, 100)
    elBar.style.width = `${pct}%`
  }

  // ── Animation loop ────────────────────────────────────────────────────────
  function tick(): void {
    if (!state.running) return
    if (state.total >= MAX_DOTS) {
      state.running = false
      btnStart.textContent = 'Restart'
      btnStart.disabled = false
      return
    }
    addDots(DOTS_PER_TICK)
    updateStats()
    state.rafId = requestAnimationFrame(tick)
  }

  function start(): void {
    state.running = true
    btnStart.disabled = true
    btnStart.textContent = 'Running…'
    btnReset.disabled = false
    state.rafId = requestAnimationFrame(tick)
  }

  function reset(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
    state.inside = 0
    state.total  = 0
    drawBackground()
    updateStats()
    btnStart.textContent = 'Start'
    btnStart.disabled    = false
    btnReset.disabled    = true
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 01</span>
        <h2 class="page-title">Monte Carlo</h2>
        <p class="page-subtitle">
          Random sampling reveals structure — and π.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="mc-canvas" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <button id="mc-start" class="btn primary">Start</button>
            <button id="mc-step"  class="btn">Add 10</button>
            <button id="mc-reset" class="btn" disabled>Reset</button>
          </div>
        </div>

        <!-- Stats + info -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π estimate</div>
            <div class="stat-value large" id="mc-estimate">0.000000</div>
            <div class="stat-error neutral" id="mc-error">Error: —</div>
            <div class="progress-bar-wrap">
              <div class="progress-bar-fill" id="mc-bar" style="width:0%"></div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-label">Points plotted</div>
            <div class="stat-value" id="mc-total">0</div>
            <div class="stat-sub">of ${MAX_DOTS.toLocaleString()} total</div>
          </div>

          <div class="legend">
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_INSIDE}"></div>
              Inside circle
            </div>
            <div class="legend-item">
              <div class="legend-dot" style="background:${C_OUTSIDE}"></div>
              Outside circle
            </div>
          </div>

          <div class="explanation">
            <h3>How it works</h3>
            <p>
              We scatter random points inside a unit square that contains an
              inscribed circle of radius ½.
            </p>
            <div class="formula">π ≈ 4 × (inside / total)</div>
            <p>
              Because the area of the circle is πr² and the square is (2r)²,
              the probability of a random point landing inside the circle is
              π/4.
            </p>
            <p>
              The more points we sample, the closer our estimate converges to π
              — but the convergence is slow: halving the error requires
              quadrupling the samples.
            </p>
          </div>
        </div>
      </div>
    `

    // Grab element refs
    canvas     = page.querySelector<HTMLCanvasElement>('#mc-canvas')!
    btnStart   = page.querySelector<HTMLButtonElement>('#mc-start')!
    btnStep    = page.querySelector<HTMLButtonElement>('#mc-step')!
    btnReset   = page.querySelector<HTMLButtonElement>('#mc-reset')!
    elEstimate = page.querySelector('#mc-estimate')!
    elTotal    = page.querySelector('#mc-total')!
    elError    = page.querySelector('#mc-error')!
    elBar      = page.querySelector<HTMLElement>('#mc-bar')!

    ctx = canvas.getContext('2d')!
    drawBackground()

    btnStart.addEventListener('click', () => {
      if (state.total >= MAX_DOTS) reset()
      start()
    })
    btnStep.addEventListener('click', () => {
      if (!state.running && state.total < MAX_DOTS) {
        addDots(10)
        updateStats()
        btnReset.disabled = false
      }
    })
    btnReset.addEventListener('click', reset)

    return page
  }

  function cleanup(): void {
    state.running = false
    if (state.rafId !== null) cancelAnimationFrame(state.rafId)
  }

  return { render, cleanup }
}