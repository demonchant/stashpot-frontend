# Phase 5 — VRF boundary, Project 0 discovery, and validator gates

## Anchor / ORAO compatibility resolution

StashPot financial programs remain on Anchor 1.2.0. ORAO 0.7.0 is isolated in `solana-vrf-adapter/`, a standalone Anchor 0.32.1 workspace. The adapter owns the ORAO CPI dependency and publishes a small immutable `RandomnessReceipt` PDA. Prize Savings never links the ORAO crate; it verifies the adapter program owner/PDA and parses the stable receipt layout.

The adapter request path is not public in the economic sense: it requires the pool-specific `vrf-authority` PDA from the Prize Savings program to sign. Prize Savings invokes the adapter only after the draw snapshot is frozen and derives the seed on-chain from draw identity, total frozen weight and the request slot. This prevents an external caller from pre-requesting the draw seed before snapshot freeze.

## Mainnet Project 0 discovery

Run `npm run p0:discover-mainnet` with a dedicated `SOLANA_RPC_URL`. Review the output. A Kamino bank may be copied into the production allowlist only if all of the following hold in the same observation:

1. production Project 0 config/group;
2. native Circle USDC mint;
3. `AssetTag.KAMINO` (3);
4. operational state accepts deposits;
5. integration metadata exists;
6. share-value multiplier exists;
7. expected Kamino reserve metadata is present;
8. withdrawal builder succeeds;
9. withdrawal simulation succeeds at the current slot.

Discovery is not authorization. No script automatically edits the allowlist.

Drift remains disabled while Project 0 reports its Drift integration banks non-operational.

## Local-validator adversarial gates

Before mainnet deployment, run both workspaces with their matching toolchains and load the ORAO classic VRF program into the local validator. Required tests:

- cannot request randomness before snapshot freeze;
- cannot call adapter request without Prize Savings `vrf-authority` PDA signature;
- cannot create a second adapter state/request for the same draw;
- cannot finalize with receipt owned by another program;
- cannot finalize with receipt PDA for another draw;
- cannot finalize with wrong ORAO request or seed;
- cannot finalize twice or reroll;
- cannot submit an entry outside selected weighted interval;
- duplicate draw-entry PDA fails;
- snapshot entry registration fails after cutoff/freeze;
- rejection-sampling result is always below total weight;
- winner/treasury split never exceeds realized reward;
- principal vault/liability solvency is unaffected by draw payout;
- Project 0 bank substitution, mint substitution, asset-tag substitution and paused/reduce-only bank all fail closed;
- simulated withdrawal failure or insufficient venue liquidity blocks signing.

## Toolchain commands to run in a prepared environment

Financial workspace:

`cd solana && cargo test --workspace && anchor build`

VRF adapter workspace:

`cd solana-vrf-adapter && cargo test --workspace && anchor build`

The adapter must use Anchor CLI/crates 0.32.1. The financial workspace must use its pinned Anchor 1.2.0 toolchain. Do not merge the workspaces or their Anchor dependencies.

No tiny-value mainnet test is authorized by this document.
