// ─── Bouncing Boxes Sound ────────────────────────────────────────────────────
// Audio feedback for collision events.

// ─── Sound Manager ───────────────────────────────────────────────────────────

export interface SoundManager {
  playCollision(): void
  cleanup(): void
}

/**
 * Creates a sound manager for playing collision sounds.
 * Uses Web Audio API for precise control over sound generation.
 */
export function createSoundManager(): SoundManager {
  let audioContext: AudioContext | null = null
  let currentOsc: OscillatorNode | null = null
  let soundTimeout: ReturnType<typeof setTimeout> | null = null

  function ensureAudioContext(): AudioContext {
    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      )()
    }
    return audioContext
  }

  function playCollision(): void {
    const ctx = ensureAudioContext()

    // Stop any currently playing sound
    if (currentOsc) {
      currentOsc.stop()
      currentOsc = null
    }
    if (soundTimeout) {
      clearTimeout(soundTimeout)
      soundTimeout = null
    }

    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Frequency sweep for impact sound
    osc.frequency.setValueAtTime(1400, now)
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.04)
    osc.type = 'sine'

    // Quick decay
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04)

    currentOsc = osc
    osc.start(now)
    osc.stop(now + 0.04)

    // Cleanup after sound finishes
    soundTimeout = setTimeout(() => {
      currentOsc = null
      soundTimeout = null
    }, 80)
  }

  function cleanup(): void {
    if (soundTimeout) {
      clearTimeout(soundTimeout)
      soundTimeout = null
    }
    if (currentOsc) {
      currentOsc.stop()
      currentOsc = null
    }
  }

  return {
    playCollision,
    cleanup,
  }
}
