/**
 * StashPot image registry — verified Unsplash photo IDs.
 * Curated to feature mostly Black & African subjects with diversity throughout.
 * All IDs verified live from unsplash.com search results.
 */

const u = (id: string, w = 1600, h?: number) => {
  const dim = h ? `&w=${w}&h=${h}&fit=crop` : `&w=${w}&fit=crop`
  return `https://images.unsplash.com/${id}?auto=format&q=80${dim}`
}

export const IMG = {
  // ── Hero ─────────────────────────────────────────────────────
  // Black family playing board games — warm, indoor lighting,
  // strong negative space on the right for text overlay.
  // Photo by National Cancer Institute on Unsplash.
  hero:    u('photo-1577896849786-738ed6c78bd3', 2400),               // Black family playing board games
  heroAlt: u('photo-1577897113176-6888367369bf', 2400),               // alt: portrait of Black family of three

  // ── Carousel ─────────────────────────────────────────────────
  carousel: [
    {
      url: u('photo-1551288049-bebda4e38f71', 2000, 1100),            // dashboard analytics on screen
      title: 'See your savings in real time.',
      subtitle: 'Track every deposit, prize, and yield stream from one clean dashboard.',
    },
    {
      url: u('photo-1556742049-0cfed4f6a45d', 2000, 1100),            // server / data center
      title: 'Built on bank grade infrastructure.',
      subtitle: 'Audited Solana vaults, hash chained audit logs, and verifiable random draws.',
    },
    {
      url: u('photo-1639152201720-5e536d254d81', 2000, 1100),         // crypto abstract
      title: 'Earn yield from the best of Solana.',
      subtitle: 'Your USDC works across Kamino, Save, Marginfi, and Drift, all automatically.',
    },
    {
      url: u('photo-1521791136064-7986c2920216', 2000, 1100),         // handshake (Cytonn) — TimeLockr/escrow
      title: 'TimeLockr: legacy and trust.',
      subtitle: 'A safety net for your family. An escrow between two parties. One vault, two purposes.',
    },
    {
      url: u('photo-1643818653783-2f818a205bb6', 2000, 1100),         // group of Black people in grass
      title: 'Savings Circles, open to anyone.',
      subtitle: 'Save together with friends or join an open circle from any country in the world.',
    },
    {
      url: u('photo-1633158829585-23ba8f7c8caf', 2000, 1100),         // mobile fintech
      title: 'Local money in. Digital dollars out.',
      subtitle: 'Top up with Naira, Cedi, Shilling, or Rand through Yellow Card or Transak.',
    },
    {
      url: u('photo-1460925895917-afdab827c52f', 2000, 1100),         // analytics screen
      title: 'Every winner is provably fair.',
      subtitle: 'Anyone can recompute any draw from public on chain data. No hidden math.',
    },
  ],

  // ── Feature grid ─────────────────────────────────────────────
  features: {
    pools:   u('photo-1530021232320-687d8e3dba54', 1200, 800),        // confetti / celebration
    // TimeLockr — handshake imagery now (covers both inheritance + escrow themes)
    vaults:  u('photo-1521791136064-7986c2920216', 1200, 800),        // two people shaking hands
    // Circles — Black community group
    circles: u('photo-1643818653783-2f818a205bb6', 1200, 800),        // group of people standing together
    loans:   u('photo-1554224155-6726b3ff858f', 1200, 800),           // helping hand / cash
    fiat:    u('photo-1601597111158-2fceff292cdc', 1200, 800),        // mobile payment
    verify:  u('photo-1550751827-4bd374c3f58b', 1200, 800),           // code on screen
  },

  // ── How it works steps ───────────────────────────────────────
  steps: {
    deposit:  u('photo-1556742502-ec7c0e9f34b1', 900, 700),
    yield:    u('photo-1591696205602-2f950c417cb9', 900, 700),
    prize:    u('photo-1607863680198-23d4b2565df0', 900, 700),
    withdraw: u('photo-1454165804606-c3d57bc86b40', 900, 700),
  },

  // ── Trust section ────────────────────────────────────────────
  trust: {
    security:   u('photo-1563013544-824ae1b704d3', 1200, 800),
    blockchain: u('photo-1518186285589-2f7649de83e0', 1200, 800),
    africa:     u('photo-1572021335469-31706a17aaef', 1200, 800),
  },

  // ── Trust / partners background tint ─────────────────────────
  performance: u('photo-1518770660439-4636190af475', 1600, 1000),

  // ── CTA / footer ─────────────────────────────────────────────
  // CTA — Black father carrying baby on beach, warm celebratory feel
  cta:    u('photo-1596510915124-38eaa5517966', 2000, 800),           // Black father with baby on beach
  footer: u('photo-1551288049-bebda4e38f71', 2000, 800),
}

// Real partner names — actual logos rendered via SVG components
export const PARTNERS = [
  'Solana',
  'Kamino',
  'Marginfi',
  'Drift',
  'Save Protocol',
  'Switchboard',
  'Yellow Card',
  'Transak',
  'Phantom',
]
