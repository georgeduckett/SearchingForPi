import type { Page } from '../router'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 560
const CANVAS_H = 320
const BOX_SIZE = 20
const WALL_X = 50
const INITIAL_X1 = 200
const INITIAL_X2 = 400
const V0 = 2
const M1 = 1

// ─── Colours ─────────────────────────────────────────────────────────────────
const C_BG      = '#13161f'
const C_WALL    = '#4a5068'
const C_BOX1    = '#4a9eff'
const C_BOX2    = '#c8922a'
const C_TEXT    = '#4a5068'

// ─── State ───────────────────────────────────────────────────────────────────
interface State {
  k: number
  m2: number
  smallBoxX: number
  smallBoxV: number
  largeBoxX: number
  largeBoxV: number
  collisions: number
  running: boolean
  rafId: number | null
  time: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function resetState(state: State): void {
  state.k = 1
  state.m2 = 100 ** state.k
  state.smallBoxX = INITIAL_X1
  state.smallBoxV = 0
  state.largeBoxX = INITIAL_X2
  state.largeBoxV = -V0
  state.collisions = 0
  state.running = false
  state.rafId = null
  state.time = 0
}

// ─── Page Factory ─────────────────────────────────────────────────────────────
export function createBouncingBoxesPage(): Page {
  const state: State = {} as State
  resetState(state)

  let canvas: HTMLCanvasElement
  let ctx: CanvasRenderingContext2D
  let elK: HTMLSelectElement
  let elHits: HTMLElement
  let elPiApprox: HTMLElement

  // ── Draw ───────────────────────────────────────────────────────────────────
  function draw(): void {
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Wall
    ctx.fillStyle = C_WALL
    ctx.fillRect(WALL_X - 5, 0, 10, CANVAS_H)

    // Boxes
    ctx.fillStyle = C_BOX1
    ctx.fillRect(state.smallBoxX - BOX_SIZE / 2, CANVAS_H / 2 - BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)

    ctx.fillStyle = C_BOX2
    ctx.fillRect(state.largeBoxX - BOX_SIZE / 2, CANVAS_H / 2 - BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)

    // Labels
    ctx.fillStyle = C_TEXT
    ctx.font = '12px monospace'
    ctx.fillText('Wall', WALL_X - 20, CANVAS_H - 10)
    ctx.fillText('Box 1 (m=1)', state.smallBoxX - 30, CANVAS_H / 2 + 40)
    ctx.fillText(`Box 2 (m=${state.m2})`, state.largeBoxX - 30, CANVAS_H / 2 + 55)
  }

  // ── Physics ────────────────────────────────────────────────────────────────
  function updatePhysics(): void {

    // Update positions
    state.smallBoxX += state.smallBoxV
    state.largeBoxX += state.largeBoxV

    // Box collision
    if (state.largeBoxX- BOX_SIZE/2 <= state.smallBoxX + BOX_SIZE/2 && state.largeBoxV < state.smallBoxV) {
      // Elastic collision
      const m1 = M1
      const m2 = state.m2
      const v1 = state.smallBoxV
      const v2 = state.largeBoxV

      const newV1 = ((m1 - m2) / (m1 + m2)) * v1 + (2 * m2 / (m1 + m2)) * v2
      const newV2 = (2 * m1 / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2

      state.smallBoxV = newV1
      state.largeBoxV = newV2
      state.collisions++
    }
    
    // Wall collision for the small box
    if (state.smallBoxX - BOX_SIZE / 2 <= WALL_X + 5 && state.smallBoxV < 0) {
      state.smallBoxV = -state.smallBoxV
      state.collisions++
    }

    // Stop if the large one is moving away from the small one and the small one isn't moving towards the wall.
    if (state.largeBoxV > state.smallBoxV && state.smallBoxV >= 0 && state.largeBoxX - state.smallBoxX > 5 * BOX_SIZE) {
      state.running = false
    }
  }

  // ── Animation ──────────────────────────────────────────────────────────────
  function tick(): void {
    if (!state.running) return

    updatePhysics()
    draw()

    elHits.textContent = state.collisions.toString()
    const piApprox = state.collisions / (10 ** state.k)
    elPiApprox.textContent = piApprox.toFixed(state.k + 1)

    if (state.running) {
      state.rafId = requestAnimationFrame(tick)
    }
  }

  function start(): void {
    if (state.running) return
    resetState(state)
    state.k = parseInt(elK.value)
    state.m2 = 100 ** state.k
    state.running = true
    state.rafId = requestAnimationFrame(tick)
  }

  function stop(): void {
    state.running = false
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
  }

  // ── Build DOM ─────────────────────────────────────────────────────────────
  function render(): HTMLElement {
    const page = document.createElement('div')
    page.className = 'page'

    page.innerHTML = `
      <header class="page-header">
        <span class="page-index">Method 05</span>
        <h2 class="page-title">Bouncing Boxes</h2>
        <p class="page-subtitle">
          Elastic collisions between two masses reveal π's digits.
        </p>
      </header>

      <div class="viz-layout">
        <!-- Canvas -->
        <div>
          <div class="canvas-wrapper">
            <canvas id="bb-canvas" width="${CANVAS_W}" height="${CANVAS_H}"></canvas>
          </div>
          <div style="margin-top:14px" class="controls">
            <select id="bb-k">
              <option value="0">k=0 (1 digit)</option>
              <option value="1">k=1 (2 digits)</option>
              <option value="2">k=2 (3 digits)</option>
              <option value="3">k=3 (4 digits)</option>
              <option value="4">k=4 (5 digits)</option>
            </select>
            <button id="bb-start" class="btn primary">Start</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">Collisions</div>
            <div class="stat-value large" id="bb-hits">0</div>
            <div class="stat-sub">after first collision</div>
          </div>

          <div class="stat-card">
            <div class="stat-label">π approximation</div>
            <div class="stat-value" id="bb-pi-approx">0.0</div>
          </div>

          <div class="explanation">
            <h3>The Bouncing Boxes Method</h3>
            <p>
              Two boxes with masses 1 and 100^k collide elastically. The number of times
              the smaller box hits the wall after the first collision gives the first k+1
              digits of π.
            </p>
            <p>
              For k=1, 31 hits → π ≈ 3.1<br>
              For k=2, 314 hits → π ≈ 3.14
            </p>
          </div>
        </div>
      </div>
    `

    canvas = page.querySelector<HTMLCanvasElement>('#bb-canvas')!
    elK = page.querySelector<HTMLSelectElement>('#bb-k')!
    elHits = page.querySelector('#bb-hits')!
    elPiApprox = page.querySelector('#bb-pi-approx')!

    ctx = canvas.getContext('2d')!
    draw()

    page.querySelector('#bb-start')!.addEventListener('click', start)

    return page
  }

  function cleanup(): void {
    stop()
  }

  return { render, cleanup }
}