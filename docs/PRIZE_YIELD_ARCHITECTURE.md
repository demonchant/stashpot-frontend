# StashPot Prize Yield Architecture

Status: security-gated design checkpoint. No external protocol deposit is enabled by this repository state.

## Economic invariant

Prize principal is a saver liability. It is never intentionally distributed as a prize or treasury fee. Only separately realized, attributable reward may enter a draw. DeFi deployment does not guarantee principal against protocol, liquidity, oracle, stablecoin, or integration losses.

## Adapter boundary

`src/lib/yield/types.ts` defines a protocol-neutral adapter. Wallet signing remains outside adapters; adapters never receive seed phrases or private keys. Every enabled strategy must use explicit allowlisted program/market/reserve accounts and enabled allocations must total 10,000 bps.

Before a reward becomes distributable, StashPot must verify that idle principal plus current redeemable strategy value covers outstanding Prize Savings principal liabilities. Current withdrawable value is displayed separately from accounting/redeemable value.

## Current Project 0 research

As of 2026-09-28, Project 0 documents `@0dotxyz/p0-ts-sdk` as its maintained TypeScript SDK and requires version 2.8.0 or newer for current oracle setups. The prior `@mrgnlabs/marginfi-client-v2` is deprecated. Project 0 exposes separate integration banks for Kamino and Drift; their positions use venue share accounting and the SDK supplies venue-specific refresh/update instructions.

This makes Project 0 a candidate unified integration route, but StashPot keeps Kamino, Drift and Project 0 as separate strategy kinds so a single provider is not a permanent architectural dependency.

Official references reviewed:
- https://docs.marginfi.com/typescript-sdk/overview
- https://docs.marginfi.com/typescript-sdk/integrations
- https://docs.marginfi.com/typescript-sdk/program-upgrade-0-1-11
- https://docs.marginfi.com/typescript-sdk/migration
- https://docs.marginfi.com/protocol-overview/program-addresses

## Mainnet gate

Do not enable deposits until all of the following are complete: reviewed current SDK integration, exact USDC bank/reserve allowlists, transaction simulation tests, withdrawal tests, share-to-underlying accounting tests, loss/liquidity-state handling, independent program verification, and explicit user approval for a tiny-value mainnet validation amount.

## Phase 3 implementation

The strategy layer now has separate mark-to-market and realized-reward accounting. A positive share-value change is *unrealized* and cannot fund a prize. `realizeStrategyWithdrawal` replenishes strategy principal first from USDC actually returned; only returned USDC above recorded strategy principal becomes realized reward. A shortfall is recorded as strategy loss and reward distribution remains blocked whenever idle principal + redeemable strategy value is below saver principal liabilities.

`ProjectZeroSdkRuntime` implements the StashPot boundary around current Project 0 integration-bank semantics. It validates an allowlisted bank, native Circle USDC and expected integration asset tag before reading/building. Kamino and Drift are represented as distinct StashPot strategies even when routed through Project 0 integration banks. This avoids silently treating Project 0 as a single opaque yield source.

The runtime uses the official wrapper-level transaction families documented by Project 0 (`makeKaminoDepositTx` / `makeKaminoWithdrawTx` and `makeDriftDepositTx` / `makeDriftWithdrawTx`) so venue refreshes and transaction construction stay in the maintained SDK rather than being recreated by StashPot.

Immediate withdrawable liquidity is still reported conservatively as zero by the reader until a reviewed withdraw-quote/simulation path is wired. Accounting/redeemable value and currently withdrawable liquidity must remain separate fields.

### Remaining activation gate

Before this runtime is enabled in production, install and pin `@0dotxyz/p0-ts-sdk@^2.8.0` with its documented peer versions, verify the exact production USDC Kamino/Drift integration-bank addresses from live Project 0 state, add those addresses to the StashPot allowlist, and run unsigned bundle simulations plus tiny explicitly-authorized mainnet deposit/withdraw tests. No mainnet amount is selected by the application or by this repository.
