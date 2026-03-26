import type { Page } from '../router'
import { queryRequired } from '../utils'
import { C_BG, C_TEXT_MUTED, C_INSIDE, C_AMBER, C_TEXT_PRIMARY } from '../colors'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 810
const CANVAS_H = 240
const BOX_SIZE = 20
const WALL_X = 50
const INITIAL_X1 = WALL_X + CANVAS_W / 3
const INITIAL_X2 = (CANVAS_W / 3) * 2
const V0 = 80
const M1 = 1

// ─── Colours (using shared with method-specific) ─────────────────────────────
const C_WALL = C_TEXT_MUTED
const C_BOX1 = C_INSIDE
const C_BOX2 = C_AMBER
const C_TEXT = C_TEXT_PRIMARY

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
  state.k = 0
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
  let elStartBtn: HTMLButtonElement
  let elResetBtn: HTMLButtonElement
  let audioContext: AudioContext | null = null
  let currentOsc: OscillatorNode | null = null
  let soundTimeout: ReturnType<typeof setTimeout> | null = null

  // ── Sound ──────────────────────────────────────────────────────────────────
  function playCollisionSound(): void {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }

    if (currentOsc) {
      currentOsc.stop()
      currentOsc = null
    }
    if (soundTimeout) {
      clearTimeout(soundTimeout)
      soundTimeout = null
    }

    const now = audioContext.currentTime
    const osc = audioContext.createOscillator()
    const gain = audioContext.createGain()

    osc.connect(gain)
    gain.connect(audioContext.destination)

    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04)
    osc.type = 'sine'

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    currentOsc = osc
    osc.start(now)
    osc.stop(now + 0.04)

    soundTimeout = setTimeout(() => {
      currentOsc = null
      soundTimeout = null
    }, 80)
  }

  // ── Draw ───────────────────────────────────────────────────────────────────
  function draw(): void {
    ctx.fillStyle = C_BG
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    // Wall
    ctx.strokeStyle = C_WALL
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(WALL_X, 0)
    ctx.lineTo(WALL_X, CANVAS_H)
    ctx.stroke()

    // Boxes
    ctx.fillStyle = C_BOX1
    ctx.fillRect(state.smallBoxX - BOX_SIZE / 2, CANVAS_H / 2 - BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)

    ctx.fillStyle = C_BOX2
    ctx.fillRect(state.largeBoxX - BOX_SIZE / 2, CANVAS_H / 2 - BOX_SIZE / 2, BOX_SIZE, BOX_SIZE)

    // Labels
    ctx.fillStyle = C_TEXT
    ctx.font = '12px monospace'
    ctx.fillText('Box 1 (m=1)', state.smallBoxX - 30, CANVAS_H / 2 + 40)
    ctx.fillText(`Box 2 (m=${state.m2})`, state.largeBoxX - 30, CANVAS_H / 2 + 55)
  }

  // ── Physics ────────────────────────────────────────────────────────────────
  function getTimeToCollision(): { type: 'box' | 'wall' | 'none'; time: number } {
    const EPSILON = 1e-6

    let timeToBoxCollision = Infinity
    if (state.smallBoxV > state.largeBoxV) {
      const relVelocity = state.smallBoxV - state.largeBoxV
      const gap = (state.largeBoxX - BOX_SIZE / 2) - (state.smallBoxX + BOX_SIZE / 2)
      if (gap > -EPSILON) {
        timeToBoxCollision = gap / relVelocity
      }
    }

    let timeToWallCollision = Infinity
    if (state.smallBoxV < 0) {
      const distToWall = (state.smallBoxX - BOX_SIZE / 2) - WALL_X
      if (distToWall > -EPSILON) {
        timeToWallCollision = distToWall / -state.smallBoxV
      }
    }

    if (timeToBoxCollision < timeToWallCollision && timeToBoxCollision < Infinity) {
      return { type: 'box', time: timeToBoxCollision }
    } else if (timeToWallCollision < Infinity) {
      return { type: 'wall', time: timeToWallCollision }
    }
    return { type: 'none', time: Infinity }
  }

  function updatePhysics(timestamp: number): void {
    const elapsedTimeMS = Math.min(timestamp - state.time, 100)
    state.time = timestamp
    let timeRemaining = elapsedTimeMS / 1000

    while (timeRemaining > 1e-6) {
      const collision = getTimeToCollision()

      if (collision.time >= timeRemaining) {
        state.smallBoxX += state.smallBoxV * timeRemaining
        state.largeBoxX += state.largeBoxV * timeRemaining
        break
      }

      state.smallBoxX += state.smallBoxV * collision.time
      state.largeBoxX += state.largeBoxV * collision.time
      timeRemaining -= collision.time

      if (collision.type === 'box') {
        const m1 = M1
        const m2 = state.m2
        const v1 = state.smallBoxV
        const v2 = state.largeBoxV

        const newV1 = ((m1 - m2) / (m1 + m2)) * v1 + (2 * m2 / (m1 + m2)) * v2
        const newV2 = (2 * m1 / (m1 + m2)) * v1 + ((m2 - m1) / (m1 + m2)) * v2

        state.smallBoxV = newV1
        state.largeBoxV = newV2
        state.collisions++
        playCollisionSound()
      } else if (collision.type === 'wall') {
        state.smallBoxV = -state.smallBoxV
        state.collisions++
        playCollisionSound()
      }
    }

    if (isSimulationComplete()) {
      stop()
    }
  }

  function isSimulationComplete(): boolean {
    const boxesSeparated = state.largeBoxV > state.smallBoxV && state.smallBoxV >= 0
    const gapLargeEnough = state.largeBoxX - state.smallBoxX > 5 * BOX_SIZE
    const smallBoxAwayFromWall = state.smallBoxX - BOX_SIZE / 2 > WALL_X + 5 * BOX_SIZE
    return boxesSeparated && gapLargeEnough && smallBoxAwayFromWall
  }


  // ── Animation ──────────────────────────────────────────────────────────────
  function tick(timestamp: number): void {
    if (!state.running) return

    updatePhysics(timestamp)
    draw()

    elHits.textContent = state.collisions.toString()
    const piApprox = state.collisions / (10 ** state.k)
    elPiApprox.textContent = piApprox.toFixed(state.k)

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
    elK.disabled = true
    elStartBtn.textContent = 'Running…'
    state.rafId = requestAnimationFrame(tick)
  }

  function stop(): void {
    state.running = false
    elK.disabled = false
    elStartBtn.textContent = 'Start'
    if (state.rafId !== null) {
      cancelAnimationFrame(state.rafId)
      state.rafId = null
    }
  }

  function reset(): void {
    stop()
    resetState(state)
    draw()
    elHits.textContent = '0'
    elPiApprox.textContent = '0'
  }

  function onKChange(): void {
    if (state.running) return
    state.k = parseInt(elK.value)
    state.m2 = 100 ** state.k
    draw()
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
            <select id="bb-k" class="control-select">
              <option value="0">k=0 (1 digit)</option>
              <option value="1">k=1 (2 digits)</option>
              <option value="2">k=2 (3 digits)</option>
              <option value="3">k=3 (4 digits)</option>
              <option value="4">k=4 (5 digits)</option>
            </select>
            <button id="bb-start" class="btn primary">Start</button>
            <button id="bb-reset" class="btn">Reset</button>
          </div>
        </div>

        <!-- Stats -->
        <div class="stats-panel">
          <div class="stat-card">
            <div class="stat-label">π approximation</div>
            <div class="stat-value large" id="bb-pi-approx">0.0</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Collisions</div>
            <div class="stat-value" id="bb-hits">0</div>
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

    canvas = queryRequired(page, '#bb-canvas', HTMLCanvasElement)
    elK = queryRequired(page, '#bb-k', HTMLSelectElement)
    elHits = queryRequired(page, '#bb-hits')
    elPiApprox = queryRequired(page, '#bb-pi-approx')
    elStartBtn = queryRequired(page, '#bb-start', HTMLButtonElement)
    elResetBtn = queryRequired(page, '#bb-reset', HTMLButtonElement)

    ctx = canvas.getContext('2d')!
    draw()

    elStartBtn.addEventListener('click', start)
    elResetBtn.addEventListener('click', reset)
    elK.addEventListener('change', onKChange)

    return page
  }

  function cleanup(): void {
    stop()
    if (soundTimeout) clearTimeout(soundTimeout)
  }

  return { render, cleanup }
}
