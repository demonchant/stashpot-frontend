# Prize Savings multi-user randomness checkpoint

## Implemented now

- Each draw freezes eligibility at a declared cutoff.
- A participant can create exactly one `DrawEntry` PDA for a draw.
- The entry records an immutable half-open cumulative weight interval `[range_start, range_end)`.
- `EqualEligible` and `PrincipalWeighted` are supported; activity weighting fails closed until its source can be verified on chain.
- After cutoff the authority can freeze the snapshot; no later entry can be added.
- Winner offset uses rejection sampling over 64 bytes so weighted selection is not implemented with biased `random % total_weight` arithmetic.
- Draw state reserves fields for the ORAO request PDA and seed.

## ORAO CPI is intentionally not linked yet

The current StashPot workspace uses `anchor-lang = 1.2.0`. The current `orao-solana-vrf = 0.7.0` crate is built against Anchor 0.32.1. Linking two incompatible Anchor generations into the financial program without compiling and testing the full workspace would be an unsafe dependency change.

The verified ORAO classic VRF program is `VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y`. The reviewed target flow is:

1. freeze draw snapshot after cutoff;
2. derive a draw-specific seed from immutable draw identity;
3. CPI to ORAO Request using the ORAO network-state, treasury and randomness request PDA;
4. persist request PDA + seed in `PrizeDraw`;
5. wait for fulfillment (never accept frontend/backend randomness);
6. deserialize `RandomnessAccountData`, require fulfilled randomness and require the expected ORAO-owned request PDA;
7. derive an unbiased offset in `[0, snapshot_total_weight)`;
8. require the submitted `DrawEntry` contains that offset and set its owner as winner;
9. prevent a second request, reroll, or second finalization.

Do not deploy multi-user prize draws until the ORAO crate/toolchain compatibility is resolved and this CPI path passes local-validator tests using the actual ORAO program binary.

## Phase 5 resolution

The compatibility boundary is now implemented as a separate `solana-vrf-adapter/` workspace pinned to Anchor 0.32.1 + `orao-solana-vrf` 0.7.0. The Anchor 1.2.0 Prize Savings program performs a raw Solana CPI into the adapter, so it does not link ORAO's older Anchor ABI.

The adapter request requires the Prize Savings pool-specific `vrf-authority` PDA signer. Prize Savings issues that signed CPI only after the draw snapshot is frozen. The seed is derived on-chain at request time. The adapter publishes a draw-specific immutable receipt PDA after ORAO fulfillment; Prize Savings verifies adapter ownership/PDA, request, seed and the winning entry interval before finalization.

Compilation and validator execution remain mandatory gates. Do not deploy either program from this checkpoint until both toolchains compile independently and the adversarial validator suite passes.
