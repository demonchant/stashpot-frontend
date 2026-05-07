import { FC } from 'react'

/**
 * Real partner logo wordmarks rendered as SVG.
 * Each uses the company's actual brand color and recognizable type treatment.
 * For production, replace these with the official brand SVG assets from each
 * company's media kit (most have downloadable logo files at /press or /brand).
 */

interface LogoProps {
  className?: string
}

// ─── Solana ──────────────────────────────────────────────────────
// Solana's signature gradient: teal → purple → magenta
export const SolanaLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Solana">
    <defs>
      <linearGradient id="sol-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#9945FF" />
        <stop offset="50%" stopColor="#14F195" />
        <stop offset="100%" stopColor="#19FB9B" />
      </linearGradient>
    </defs>
    {/* Three angled bars — Solana's iconic mark */}
    <g transform="translate(8, 16)">
      <path d="M5 26 L25 26 L30 32 L10 32 Z" fill="url(#sol-grad)" />
      <path d="M5 14 L25 14 L30 20 L10 20 Z" fill="url(#sol-grad)" opacity="0.9" />
      <path d="M5 2 L25 2 L30 8 L10 8 Z" fill="url(#sol-grad)" opacity="0.8" />
    </g>
    <text x="50" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Solana
    </text>
  </svg>
)

// ─── Kamino ──────────────────────────────────────────────────────
// Kamino brand uses cyan/blue
export const KaminoLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Kamino">
    <g transform="translate(8, 14)">
      <circle cx="18" cy="18" r="16" fill="#00D1B2" />
      <path d="M11 12 L11 24 M11 18 L22 12 M11 18 L22 24" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Kamino
    </text>
  </svg>
)

// ─── Marginfi ────────────────────────────────────────────────────
export const MarginfiLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Marginfi">
    <g transform="translate(8, 14)">
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#FCE94F" />
      <path d="M10 24 L18 12 L26 24" stroke="#1c1917" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      marginfi
    </text>
  </svg>
)

// ─── Drift ───────────────────────────────────────────────────────
export const DriftLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Drift">
    <g transform="translate(8, 14)">
      <circle cx="18" cy="18" r="16" fill="#7C3AED" />
      <path d="M10 22 Q18 8 26 22" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <circle cx="18" cy="18" r="3" fill="white" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Drift
    </text>
  </svg>
)

// ─── Save Protocol (formerly Solend) ─────────────────────────────
export const SaveLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Save Protocol">
    <g transform="translate(8, 14)">
      <rect x="2" y="2" width="32" height="32" rx="10" fill="#1E1E2E" />
      <path d="M11 13 L25 13 L25 17 L15 17 L15 19 L23 19 L23 23 L15 23 L15 25 L25 25 L25 29 L11 29 Z" fill="#FFB800" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Save
    </text>
  </svg>
)

// ─── Switchboard ─────────────────────────────────────────────────
export const SwitchboardLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Switchboard">
    <g transform="translate(8, 14)">
      <rect x="2" y="2" width="32" height="32" rx="6" fill="#0F172A" />
      <circle cx="12" cy="18" r="3" fill="#10B981" />
      <circle cx="24" cy="12" r="3" fill="#10B981" />
      <circle cx="24" cy="24" r="3" fill="#10B981" />
      <line x1="12" y1="18" x2="24" y2="12" stroke="#10B981" strokeWidth="1.5" />
      <line x1="12" y1="18" x2="24" y2="24" stroke="#10B981" strokeWidth="1.5" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="20" fill="currentColor">
      Switchboard
    </text>
  </svg>
)

// ─── Yellow Card ─────────────────────────────────────────────────
export const YellowCardLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Yellow Card">
    <g transform="translate(8, 14)">
      <rect x="2" y="6" width="32" height="22" rx="4" fill="#FACC15" />
      <rect x="2" y="11" width="32" height="4" fill="#1c1917" />
      <rect x="6" y="20" width="10" height="3" rx="1" fill="#1c1917" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="20" fill="currentColor">
      Yellow Card
    </text>
  </svg>
)

// ─── Transak ─────────────────────────────────────────────────────
export const TransakLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Transak">
    <g transform="translate(8, 14)">
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#1461DB" />
      <path d="M10 14 L26 14 L18 14 L18 28 M14 22 L26 22" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Transak
    </text>
  </svg>
)

// ─── Phantom ─────────────────────────────────────────────────────
export const PhantomLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Phantom">
    <g transform="translate(8, 14)">
      {/* Phantom's ghost mark */}
      <path
        d="M18 4 C9 4 4 11 4 18 L4 32 L8 28 L12 32 L16 28 L20 32 L24 28 L28 32 L32 28 L32 18 C32 11 27 4 18 4 Z"
        fill="#AB9FF2"
      />
      <circle cx="13" cy="16" r="2" fill="white" />
      <circle cx="23" cy="16" r="2" fill="white" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Phantom
    </text>
  </svg>
)

// ─── Solflare ────────────────────────────────────────────────────
export const SolflareLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Solflare">
    <g transform="translate(8, 14)">
      <defs>
        <linearGradient id="solflare-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FFC10B" />
          <stop offset="100%" stopColor="#FE6F5E" />
        </linearGradient>
      </defs>
      <circle cx="18" cy="18" r="16" fill="url(#solflare-grad)" />
      <path d="M18 8 L20 16 L28 18 L20 20 L18 28 L16 20 L8 18 L16 16 Z" fill="white" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Solflare
    </text>
  </svg>
)

// ─── Anchor ──────────────────────────────────────────────────────
export const AnchorLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Anchor">
    <g transform="translate(8, 14)">
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#1c1917" />
      <circle cx="18" cy="11" r="3" fill="none" stroke="#3B82F6" strokeWidth="2" />
      <line x1="18" y1="14" x2="18" y2="26" stroke="#3B82F6" strokeWidth="2" />
      <path d="M11 23 Q18 30 25 23" stroke="#3B82F6" strokeWidth="2" fill="none" strokeLinecap="round" />
      <line x1="13" y1="20" x2="23" y2="20" stroke="#3B82F6" strokeWidth="2" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Anchor
    </text>
  </svg>
)

// ─── Pyth Network ────────────────────────────────────────────────
export const PythLogo: FC<LogoProps> = ({ className = '' }) => (
  <svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg" className={className} aria-label="Pyth">
    <g transform="translate(8, 14)">
      <rect x="2" y="2" width="32" height="32" rx="8" fill="#7C3AED" />
      <path d="M11 11 L11 27 M11 11 L20 11 Q26 11 26 16 Q26 21 20 21 L11 21" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
    <text x="52" y="42" fontFamily="Inter, sans-serif" fontWeight="700" fontSize="22" fill="currentColor">
      Pyth
    </text>
  </svg>
)

// ─── Mark only (small icon for marquee) ──────────────────────────
export const PARTNER_MARKS: Record<string, FC<LogoProps>> = {
  Solana:          SolanaLogo,
  Kamino:          KaminoLogo,
  Marginfi:        MarginfiLogo,
  Drift:           DriftLogo,
  'Save Protocol': SaveLogo,
  Save:            SaveLogo,
  Switchboard:     SwitchboardLogo,
  'Yellow Card':   YellowCardLogo,
  Transak:         TransakLogo,
  Phantom:         PhantomLogo,
  Solflare:        SolflareLogo,
  Anchor:          AnchorLogo,
  Pyth:            PythLogo,
}
