# StashPot Solana Security Review Continuation

Status: IN PROGRESS — do not deploy these programs to mainnet yet.

This review continues from the interrupted Codex adversarial pass in the uploaded working tree.

## Fixed in this continuation

### HIGH — Secured-loan collateral trapped after full repayment
A secured loan could reach `Repaid` without a path to return its collateral. Added an explicit borrower-signed `release_repaid_collateral` path, bound to the recorded policy, loan, collateral vault, native USDC mint, and borrower token account. The loan now records whether collateral was released to prevent duplicate release.

### HIGH — Liquidation transferred collateral surplus to Lending Treasury
The previous liquidation path transferred the entire recorded collateral balance to the treasury even when outstanding debt was lower. Liquidation now splits collateral into `applied_to_debt` and `surplus_returned`; only debt coverage goes to the Lending Treasury and surplus is returned to the borrower. The liquidation event records both amounts.

### HIGH — Prize draw cutoff semantics allowed eligibility drift
`start_draw` previously required `cutoff_at <= now`, while solo finalization evaluated eligibility at finalization time. That could make the cutoff ineffective. A draw must now start with a cutoff that is not in the past, finalization must wait until the cutoff, and participant eligibility is evaluated at the stored cutoff timestamp. Starting a draw moves the pool out of `Idle`, which freezes principal deposits/withdrawals during the draw lifecycle.

### MEDIUM — StashScore attestation version replay/overwrite
Score attestations previously accepted `score_version >= current_version`, allowing the same version to overwrite prior evidence/score values. Updates now require a strictly increasing score version.

### Previously fixed by Codex and preserved
`complete_draw` requires both pool and draw state to be `Claimable` and both allocations to have been claimed before advancing the draw sequence, preventing repeatable draw completion.

## Verification state

The uploaded project was produced on Windows and included Windows `node_modules`. This Linux execution environment cannot execute those binaries. A clean `npm ci` did not finish within the tool execution window. Rust/Cargo/Anchor are not installed in this execution environment, so the Solana workspace has NOT been recompiled here after these changes.

The original uploaded checkpoint reported all five program crates compiling and host-side tests passing before this continuation. Those earlier results must not be treated as verification of the new changes.

Before any commit intended for deployment, run at minimum:

- `cargo fmt --manifest-path solana/Cargo.toml -- --check`
- `cargo test --workspace --manifest-path solana/Cargo.toml`
- Anchor/local-validator integration tests for token transfers and PDA signing
- frontend `npm test`
- frontend `npm run build:strict`

## Review still open

- Full instruction/account-constraint review for all five programs
- Circle delinquency/recovery and close semantics
- Reputation-loan default/exposure accounting policy
- Prize multi-user randomness implementation (solo flow only is currently meaningful)
- Yield adapter CPI/account validation for Kamino, Drift, and Project 0
- Strategy loss and withdrawal-liquidity accounting
- End-to-end local-validator tests
- Frontend IDL/program integration
- Backend/indexer and unified Activity integration
- Mainnet deployment checklist and tiny-value validation plan

## 2026-09-28 adversarial continuation — phase 2

### SAVINGS CIRCLES — HIGH — delinquent cycle deadlock (fixed in source)
`mark_cycle_overdue` moved a circle to `Delinquent`, while `contribute` and `execute_cycle_payout` previously accepted only `Active`. That made a late, partially-funded circle impossible to cure. Delinquent cycles may now accept the missing current-cycle contributions, and a fully funded delinquent cycle may execute its immutable payout. Successful payout returns the next cycle to `Active`; no payout order or amount can be changed during recovery.

### MICROLOANS — HIGH — reputation exposure lifecycle (fixed in source)
Reputation exposure previously increased by original principal but was released only on full repayment. Partial principal repayment did not release exposure, and a default had no explicit terminal write-off path. The loan now records `principal_outstanding`; repayments reduce principal exposure as principal is repaid. A policy-authority-only `close_defaulted_reputation` path records the write-off, releases only the remaining principal exposure, clears the profile's outstanding debt for the closed loan, and closes the active-loan count. The default counter remains, so reputation borrowing remains blocked by the existing prior-default rule.

### PRIZE SAVINGS — MULTI-USER DRAW — HIGH — intentionally still gated
The current program has an honest solo draw but does not yet have a production-grade multi-user winner-selection implementation. Do not add trusted frontend randomness or an authority-selected winner. Multi-user draws remain a release blocker until a reviewed Solana randomness/VRF adapter is selected and verified on-chain, with participant/weight snapshots frozen at cutoff and tests proving winner selection cannot be manipulated by participant ordering, late deposits, withdrawals, or authority choice.

### PRIZE YIELD — external venue adapter boundary (added, deposits remain disabled)
Added protocol-neutral yield types, allocation validation, atomic allocation without rounding loss, and a principal-solvency helper. Added a fail-closed Project 0 adapter placeholder. No external-protocol transaction builder is enabled in this checkpoint.

Research on 2026-09-28 found Project 0's maintained SDK is `@0dotxyz/p0-ts-sdk` >=2.8.0; legacy `@mrgnlabs/marginfi-client-v2` is deprecated. Project 0 documents separate Kamino and Drift integration banks and venue-share accounting. Exact production banks/reserves and transaction builders still require allowlisting and integration tests before funds can move.

### Verification limitation
This environment does not have Rust/Anchor installed. A clean npm dependency install was attempted, but package installation exceeded the execution window and did not finish, so Vitest/typecheck/build could not be rerun here. These source changes therefore remain uncommitted/security-gated and must be compiled/tested in a Rust/Anchor + supported Node environment before deployment.
