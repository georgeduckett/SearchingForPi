// ─── Page Definitions ─────────────────────────────────────────────────────────
// Single source of truth for all page metadata.
// This file contains only the page info types and metadata declarations.

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PageInfo {
  /** URL hash for routing (e.g., 'monte-carlo') */
  hash: string
  /** Display title */
  title: string
  /** Short description for cards */
  desc: string
  /** Method index for display (e.g., "01", "02") - undefined for non-method pages */
  index?: string
}

// ─── Page Metadata ────────────────────────────────────────────────────────────

export const homePage: PageInfo = {
  hash: 'home',
  title: 'Introduction',
  desc: 'Explore the many fascinating ways to calculate π.',
}

export const methodPages: PageInfo[] = [
  {
    hash: 'monte-carlo',
    title: 'Monte Carlo',
    desc: 'Scatter random points inside a square and count how many land inside its inscribed circle. The ratio reveals π with beautiful inevitability.',
    index: '01',
  },
  {
    hash: 'leibniz',
    title: 'Leibniz Series',
    desc: 'The alternating series 1 - 1/3 + 1/5 - 1/7 + … converges to π/4. Simple, elegant, and agonisingly slow.',
    index: '02',
  },
  {
    hash: 'buffon',
    title: "Buffon's Needle",
    desc: 'Drop a needle at random onto a lined surface. The probability it crosses a line is directly tied to π — a startling physical experiment.',
    index: '03',
  },
  {
    hash: 'coin-toss',
    title: 'Coin Toss Sequences',
    desc: 'Toss coins until heads exceed tails. The average ratio of heads to total tosses converges to π/4 in a surprising mathematical twist.',
    index: '04',
  },
  {
    hash: 'bouncing-boxes',
    title: 'Bouncing Boxes',
    desc: 'Two boxes with mass ratio 100^k collide elastically with a wall. The number of collisions between them encodes the digits of π in a remarkable way.',
    index: '05',
  },
  {
    hash: 'archimedes',
    title: "Archimedes' Polygons",
    desc: 'Squeeze π between inscribed and circumscribed regular polygons doubling in sides. Archimedes used just 96 sides to achieve remarkable precision in 250 BCE.',
    index: '06',
  },
  {
    hash: 'draw-circle',
    title: 'Draw a Circle',
    desc: "Draw your own circle by clicking and dragging. The circumference divided by the diameter approaches π — hands-on understanding of π's geometric meaning.",
    index: '07',
  },
  {
    hash: 'riemann',
    title: 'Riemann Integral',
    desc: 'The area under the curve y = 4/(1+x²) from 0 to 1 equals π exactly. Watch rectangles progressively fill this area.',
    index: '08',
  },
  {
    hash: 'basel',
    title: 'Basel Problem',
    desc: 'Euler proved that the sum of 1/n² equals π²/6. Visualize the sum as stacking squares of decreasing area converging to this remarkable result.',
    index: '09',
  },
  {
    hash: 'wallis',
    title: 'Wallis Product',
    desc: 'An elegant infinite product (2/1 × 2/3) × (4/3 × 4/5) × ... converges to π/2. Watch the product oscillate and settle toward π.',
    index: '10',
  },
  {
    hash: 'coprimality',
    title: 'Coprimality',
    desc: 'Two random integers are coprime with probability 6/π² (about 60.79%). Generate pairs and estimate π from the coprime ratio.',
    index: '11',
  },
  {
    hash: 'galton',
    title: 'Galton Board',
    desc: 'Balls falling through pegs form a binomial distribution. Through Stirlings approximation, the distribution shape connects to π.',
    index: '12',
  },
  {
    hash: 'circle-packing',
    title: 'Circle Packing',
    desc: 'Randomly pack circles into a square. The covered area relates to π through the sum of squared radii.',
    index: '13',
  },
  {
    hash: 'gas-molecules',
    title: 'Gas Molecules',
    desc: 'Simulate ideal gas particles bouncing in a container. The Maxwell-Boltzmann speed distribution connects to π through statistical mechanics.',
    index: '14',
  },
]

export const allPages: PageInfo[] = [homePage, ...methodPages]

// ─── Helper Functions ─────────────────────────────────────────────────────────

/** Get method page info by hash */
export function getMethodInfo(hash: string): PageInfo | undefined {
  return methodPages.find(p => p.hash === hash)
}

/** Get method index by hash (e.g., "01", "02") */
export function getMethodIndex(hash: string): string {
  return getMethodInfo(hash)?.index ?? ''
}
