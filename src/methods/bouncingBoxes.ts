import type { Page } from '../router'

// ─── Constants ───────────────────────────────────────────────────────────────
const CANVAS_W = 560
const CANVAS_H = 320
const BOX_SIZE = 20
const WALL_X = 50
const INITIAL_X1 = WALL_X + 20
const INITIAL_X2 = INITIAL_X1 + 80
const V0 = 10
const M1 = 1

// ─── Colours ─────────────────────────────────────────────────────────────────
const C_BG      = '#13161f'
const C_WALL    = '#4a5068'
const C_BOX1    = '#4a9eff'
const C_BOX2    = '#c8922a'
const C_TEXT    = '#ffffff'

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
  let elStartBtn: HTMLButtonElement
  let elResetBtn: HTMLButtonElement
  let audioContext: AudioContext | null = null
  let currentOsc: OscillatorNode | null = null
  let soundTimeout: number | null = null

  // ── Sound ──────────────────────────────────────────────────────────────────
  function playCollisionSound(): void {
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }

    // Stop existing sound if any
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
    ctx.fillText('Wall', WALL_X - 50, CANVAS_H - 10)
    ctx.fillText('Box 1 (m=1)', state.smallBoxX - 30, CANVAS_H / 2 + 40)
    ctx.fillText(`Box 2 (m=${state.m2})`, state.largeBoxX - 30, CANVAS_H / 2 + 55)
  }

  // ── Physics ────────────────────────────────────────────────────────────────
  function getTimeToCollision(): { type: 'box' | 'wall' | 'none'; time: number } {
    const EPSILON = 1e-6

    // Calculate time to box-to-box collision
    let timeToBoxCollision = Infinity
    if (state.smallBoxV > state.largeBoxV) {
      const relVelocity = state.smallBoxV - state.largeBoxV
      const gap = (state.largeBoxX - BOX_SIZE / 2) - (state.smallBoxX + BOX_SIZE / 2)
      if (gap > -EPSILON) {
        timeToBoxCollision = gap / relVelocity
      }
    }

    // Calculate time to wall collision for small box
    let timeToWallCollision = Infinity
    if (state.smallBoxV < 0) {
      const distToWall = (state.smallBoxX - BOX_SIZE / 2) - (WALL_X + 5)
      if (distToWall > -EPSILON) {
        timeToWallCollision = distToWall / -state.smallBoxV
      }
    }

    // Return the earliest collision
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
    let timeRemaining = elapsedTimeMS / 1000 // Convert to seconds

    // Loop through collisions until time is consumed or no more collisions
    while (timeRemaining > 1e-6) {
      const collision = getTimeToCollision()

      // If no collision will happen, just move for remaining time and exit
      if (collision.time >= timeRemaining) {
        state.smallBoxX += state.smallBoxV * timeRemaining
        state.largeBoxX += state.largeBoxV * timeRemaining
        break
      }

      // Move to collision point
      state.smallBoxX += state.smallBoxV * collision.time
      state.largeBoxX += state.largeBoxV * collision.time
      timeRemaining -= collision.time

      // Resolve collision
      if (collision.type === 'box') {
        // Elastic collision between boxes
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
        // Wall collision (elastic)
        state.smallBoxV = -state.smallBoxV
        state.collisions++
        playCollisionSound()
      }
    }

    // Stop if the large one is moving away and small one isn't approaching wall
    if (state.largeBoxV > state.smallBoxV && state.smallBoxV >= 0 && state.largeBoxX - state.smallBoxX > 5 * BOX_SIZE) {
      state.running = false
    }
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
    elStartBtn = page.querySelector<HTMLButtonElement>('#bb-start')!
    elResetBtn = page.querySelector<HTMLButtonElement>('#bb-reset')!

    ctx = canvas.getContext('2d')!
    draw()

    elStartBtn.addEventListener('click', start)
    elResetBtn.addEventListener('click', reset)
    elK.addEventListener('change', onKChange)

    return page
  }

  function cleanup(): void {
    stop()
  }

  return { render, cleanup }
}