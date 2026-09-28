# StashPot Mainnet Wallet

StashPot is a self-custodial personal USDC dashboard for Solana mainnet.

## What it does

- Connects Phantom or Solflare.
- Reads the wallet's real SOL and native USDC balances from Solana mainnet.
- Displays a receive address for direct native-USDC transfers.
- Embeds the official Jupiter Plugin to swap supported Solana assets to USDC.
- Tracks a personal savings target locally in the browser.

StashPot never receives private keys, recovery phrases, or custody of funds. The old
Render API and its simulated off-chain balances are not used.

## Safety boundary

Prize pools, loans, circles, and inheritance vaults are intentionally unavailable.
No verified or audited StashPot mainnet program deployment exists in the public
project, so this build does not route real assets into those features.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

`VITE_SOLANA_MAINNET_RPC_URL` is optional. If omitted, the public Solana mainnet
RPC endpoint is used.

## Checks

```bash
npm run typecheck
npm run build
```

## Production

The application is pinned to Solana mainnet. It counts only Circle-issued native
USDC at mint `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`.
