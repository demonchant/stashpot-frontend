# Phase 5 status

Implemented:
- isolated Anchor 0.32.1 ORAO 0.7.0 adapter workspace;
- Prize Savings raw-CPI compatibility bridge without linking mixed Anchor ABIs;
- pool-specific Prize Savings PDA authorization for randomness requests;
- request only after frozen snapshot;
- adapter-owned immutable randomness receipt verification;
- multi-user weighted winner finalization from verified receipt;
- Project 0 production mainnet discovery script;
- production Project 0 allowlists fail closed and remain empty until live SDK discovery/review;
- local-validator adversarial test matrix documented.

Blocked by this execution environment:
- Rust, Cargo, Solana CLI and Anchor CLI are not installed, so neither Rust workspace can be compiled here;
- npm registry access timed out, so p0-ts-sdk could not be installed/executed here and live mainnet bank discovery could not be completed;
- therefore no Kamino bank address has been promoted to the production allowlist and no mainnet funds are authorized.
