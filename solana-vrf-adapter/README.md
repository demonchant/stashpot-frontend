# StashPot VRF Adapter

Compatibility boundary between StashPot's Anchor 1.x financial programs and ORAO VRF 0.7.0 / Anchor 0.32.1.

The adapter must remain a separate deployable program/workspace. It requests ORAO randomness only when the Prize Savings program's pool-specific PDA signs the CPI. Once ORAO fulfills the request, the adapter publishes one immutable receipt PDA for the draw. Prize Savings verifies that receipt without linking ORAO's Anchor dependency.

Do not deploy this adapter until both workspaces compile and the local-validator adversarial suite passes with the actual ORAO classic VRF program loaded.
