# Project 0 mainnet discovery checkpoint

- SDK is pinned to `@0dotxyz/p0-ts-sdk` 2.8.4 in `package.json`.
- Required peers are pinned/compatible at the application layer: `@solana/web3.js` 1.98.4 and `@coral-xyz/anchor` 0.30.1.
- Bank addresses are discovered from the live production Project 0 client by native Circle USDC mint + integration asset tag, then must pass a separate StashPot allowlist before any deposit is built.
- Kamino tag: 3. Drift tag: 4.
- Drift deposits are hard-disabled by StashPot policy while Project 0's current security notice says Drift banks are non-operational following the venue transition.
- A Project 0 withdrawal must pass `computeMaxWithdrawForBank` and transaction simulation immediately before wallet signing.
- Discovery is not authorization: a newly discovered bank is never automatically trusted.

The exact Kamino bank address is intentionally not hard-coded from a web page. It must be captured from a live `Project0Client.initialize(connection, getConfig("production"))` run, compared with the expected mint/tag/integration metadata, reviewed, and then copied into the production allowlist.
