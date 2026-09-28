# StashPot Solana programs

This workspace is deliberately separate from the production mainnet wallet frontend. The IDs in `Anchor.toml` are development identifiers only and are not configured in the frontend.

The programs pin stable Anchor `1.2.0`, accept only the classic SPL Token program, and validate the exact Circle-issued Solana USDC mint. Each financial product has an isolated program and vault authority domain.

No program keypair, wallet keypair, seed phrase, or private key belongs in this repository. Generate deployment keypairs outside source control and reconcile `declare_id!`, `Anchor.toml`, and the built artifact before any deployment.

On Windows, use WSL for Solana CLI, Anchor CLI, a local validator, and full `anchor test`. Host-side Rust unit tests can run with `cargo test --workspace`.
