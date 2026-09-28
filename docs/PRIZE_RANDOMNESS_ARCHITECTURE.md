# Prize Savings Multi-user Randomness Architecture

Status: reviewed design gate. Solo draws are supported by the current program. Multi-user draw finalization remains disabled until the VRF CPI and frozen participant snapshot are implemented and tested.

## Security objective

Neither the StashPot frontend, pool authority, backend/indexer, nor a participant may choose or retry randomness after learning an outcome. The eligible participant set and weights must be frozen before the randomness request can influence the winner.

## Proposed lifecycle

1. `start_draw` freezes the draw id, reward amount and future cutoff.
2. At/after cutoff, an on-chain snapshot process records eligible participants and their immutable weights for that draw. Deposits or withdrawals after cutoff affect future draws only.
3. The program commits a deterministic snapshot hash and total weight.
4. StashPot requests ORAO Solana VRF randomness by CPI using a seed bound to pool + draw id + snapshot hash.
5. Draw enters `RandomnessPending`; no restart/reseed is permitted for that draw.
6. After the ORAO request account is fulfilled, `finalize_multi_draw` verifies the expected VRF program/request account and consumes the fulfilled bytes.
7. Winner index = unbiased bounded mapping of VRF bytes into `[0,total_weight)`. Iterate the frozen cumulative weights to select exactly one eligible participant.
8. Winner and randomness request are permanently recorded. Existing 85/15 reward claims then proceed.

## Required anti-manipulation properties

- participant/weight snapshot precedes usable randomness;
- one randomness seed/request per draw;
- no authority-supplied random bytes;
- no frontend randomness;
- no reroll after fulfillment;
- no participant additions/removals in a frozen snapshot;
- use rejection sampling rather than naïve modulo when mapping a fixed-width random integer to a non-power-of-two weight range;
- snapshot totals use checked arithmetic;
- VRF request account owner/program/state must be verified;
- winner account supplied to finalization must match the selected frozen entry;
- timeout/recovery cannot let an authority choose a more favorable seed; cancellation returns reserved reward to the reward reserve only under an explicit, delayed, auditable recovery rule.

## ORAO choice

ORAO's current Solana documentation provides an Anchor CPI request flow and stores fulfilled randomness on-chain after a byzantine quorum. That matches StashPot's requirement for verifiable on-chain consumption. The exact crate version, mainnet program/config addresses, account layout and fee path must be pinned from the reviewed release before code is enabled.

## Tests required before multi-user enablement

- snapshot mutation after cutoff fails;
- duplicate randomness request fails;
- wrong VRF program/request fails;
- unfulfilled request fails;
- replaying another draw's randomness fails;
- wrong snapshot hash fails;
- wrong winner account fails;
- boundary weights (1, max u64-safe total) select correctly;
- statistical property test for bounded mapping;
- authority cannot reroll/cancel immediately after seeing result;
- reward principal invariant remains true through every draw state.
