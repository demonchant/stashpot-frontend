# StashPot Frontend

A savings protocol on Solana. Email magic link auth via Privy. Wallet fallback via Solana wallet adapter.

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Privy (`@privy-io/react-auth`) — primary auth & embedded wallets
- Solana wallet adapter — fallback for Phantom / Solflare power users
- Swiper.js + AOS for scroll animations and carousels

## Quick start

```bash
npm install
cp .env.example .env
# Edit .env — fill in VITE_API_URL and VITE_PRIVY_APP_ID
npm run dev
```

Open http://localhost:5173

## Environment variables

| Var | Required | Description |
|---|---|---|
| `VITE_API_URL` | yes | Backend URL (e.g. `https://stashpot-backend.onrender.com`) |
| `VITE_PRIVY_APP_ID` | yes | Privy app ID from https://dashboard.privy.io |
| `VITE_SOLANA_RPC_URL` | yes | Devnet or mainnet RPC endpoint |
| `VITE_SOLANA_MAINNET_RPC_URL` | optional | Mainnet RPC for prod |
| `VITE_NETWORK` | yes | `devnet` or `mainnet-beta` |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on :5173 |
| `npm run build` | Production build (Vite only, no tsc — fast & forgiving) |
| `npm run build:strict` | Production build with TypeScript checks |
| `npm run typecheck` | Type-check without emitting |
| `npm run preview` | Preview the production build locally |

## Deployment

See `DEPLOYMENT.md` (provided alongside this codebase) for the full step-by-step
guide covering:
- GitHub repo reset
- Vercel project setup
- Privy dashboard configuration
- Backend `/api/auth/privy/verify` route wiring

## Auth flow

1. User clicks "Get started" → opens Privy modal
2. User picks email magic link, Google, passkey, or external wallet (Phantom etc)
3. Privy authenticates the user and provisions an embedded Solana wallet if needed
4. Frontend calls `getAccessToken()` to get a Privy JWT
5. Frontend POSTs `{ idToken, walletAddress }` to `/api/auth/privy/verify`
6. Backend verifies the JWT signature with `privy.verifyAuthToken(token)`
7. Backend upserts the StashPot user, links the Solana wallet, and issues a StashPot JWT
8. All subsequent API calls use the StashPot JWT in `Authorization: Bearer ...`

## Folder structure

```
src/
├── App.tsx                    # PrivyProvider + Solana wallet adapter wrap
├── main.tsx                   # ReactDOM root
├── index.css                  # Tailwind + global styles
├── components/
│   ├── Layout.tsx             # Logged-in shell with sidebar
│   ├── NavBar.tsx             # Landing page top nav
│   ├── Footer.tsx
│   ├── Logo.tsx               # Wraps /public/stashpot-logo.png
│   ├── PartnerLogos.tsx       # SVG wordmarks for Solana/Kamino/etc
│   └── SEO.tsx
├── hooks/
│   └── useStashpotAuth.ts     # Privy + wallet adapter dual flow
├── lib/
│   ├── api.ts                 # Axios client with all backend routes
│   ├── images.ts              # Verified Unsplash image registry
│   └── utils.ts               # cn(), shortAddress(), formatUSDC()
├── pages/
│   ├── Landing.tsx            # Marketing site
│   ├── Dashboard.tsx
│   ├── Pools.tsx
│   ├── Vaults.tsx             # TimeLockr (inheritance + escrow)
│   ├── Circles.tsx
│   ├── Loans.tsx
│   ├── Fiat.tsx               # On-ramp via Yellow Card / Transak
│   ├── Verify.tsx             # Public draw verification
│   └── Referrals.tsx
└── store/
    └── auth.ts                # Zustand store for StashPot session
```
