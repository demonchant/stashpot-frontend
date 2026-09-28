# StashPot Recovery Audit

Date: 2026-09-28  
Frontend baseline: `fce2876`  
Original frontend history inspected: `582baae` and surrounding commits  
Original backend inspected: `demonchant/stashpot-backend` at `a1a0a9363cf6f58114f27f21d5d07662608d865e`

## Conclusion

The repositories contain a broad StashPot product UI and a PostgreSQL/Express prototype, but no Anchor workspace, deployable Solana program source, IDL, stable program IDs, or verified on-chain financial state. The old backend changed a database `balances.usdc` value for deposits, withdrawals, circle contributions, loan disbursements and repayments. Those mutations must not be restored as financial truth.

The mainnet wallet/Jupiter layer introduced at `fce2876` is retained. Product screens are restored behind explicit program gates while real programs are developed and tested separately.

## Recovered mechanics

### Prize-linked savings

- Three cycles existed: daily, weekly and monthly.
- The old scheduler assigned 10%, 60% and 30% of a calculated yield amount to those cycles.
- The intended participant weight was documented as:

  `average_balance × log(1 + average_balance) × hours_held × exp(-0.15 × early_exits)`

- A five-minute entry cutoff returned zero weight for last-minute entries.
- Average balance used an exponential moving average with an initial alpha of 0.1.
- The UI and verification route referred to Switchboard VRF and Merkle commitments.
- Protocol information stated an 85% winner / 15% treasury reward split.

What was not real:

- The scheduler estimated yield from a hard-coded 8.74% APY instead of reading strategy positions.
- Its winner selection called `Math.random()` when no external random value was supplied.
- It credited the winner by updating the database balance and did not implement the documented 15% treasury transfer.
- Static allocations (Kamino 35%, marginfi 30%, Drift 20%, Solend 15%) and APYs were display data, not positions.

Current requirements override the unsafe implementation: saver principal is never a prize or treasury fee; only realized yield from allowlisted supply/lend strategies is eligible; the reward split is 85/15; a solvency invariant must pass; solo mode is valid; and multi-user randomness must be verifiable.

### TimeLockr

The original UI/backend described a dead-man’s-switch inheritance vault with an inactivity period, check-ins and percentage beneficiaries. It did not transfer or lock tokens on-chain. The cumulative product requirements redefine the primary TimeLockr flow as owner-controlled fixed-duration savings with program-enforced unlock timestamps. The recovered inheritance design is therefore documented, but it is not silently conflated with fixed time locks.

### Savings Circles

- Original defaults: six members, 100 USDC contribution and seven-day cycle.
- Creator occupied slot zero; later members received join-order slots.
- Contributions had to equal the configured amount and were unique per member/cycle.
- A circle could accept contributions only after `started=true`.

No start, payout, missed-contribution, leave, settlement or close lifecycle existed in the backend. Contributions only reduced a database balance. The replacement must implement explicit solo/test and multi-user states, an isolated vault, fixed member order, one payout per cycle and liability-safe closure.

### Microloans

The prototype exposed four tiers:

| Tier | Maximum USDC | APR | Collateral | Minimum score |
|---|---:|---:|---:|---:|
| A | 10,000 | 8% | 150% | 0 |
| B | 5,000 | 10% | 120% | 500 |
| C | 2,000 | 12% | 110% | 700 |
| D | 500 | 18% | 0% | 850 |

It allowed up to three active loans and calculated time-proportional simple interest. Collateral, disbursement and repayment were database mutations; there was no Lending Treasury or program enforcement. These large prototype limits are not adopted as safe defaults. Current requirements supersede them with separately funded secured/reputation modes, versioned policy, small initial reputation limits, explicit terms and treasury exposure controls.

### StashScore

The database had dimensions for savings, circles, vaults, loans and longevity, plus a score-event table, breadth bonus and default flag. No complete scoring implementation or reliable on-chain signal verifier was found. The new model must be versioned, explainable and derived from verified program events, with anti-farming rules for tiny loops, self-created circles and loan cycling.

### Referrals, activity and verification

- Referrals tracked a code, referred account, deposit flag and reward-paid flag.
- Activity stored generic transaction rows without on-chain reconciliation.
- Verification recomputed weights from the database and described a future Merkle/VRF workflow.

These are useful metadata concepts, but none may assert a financial transfer without a confirmed signature and decoded on-chain state.

## Security-relevant findings in the recovered backend

1. Financial source of truth was PostgreSQL rather than Solana.
2. A missing program ID generated a random public key at process startup.
3. A missing private key generated an ephemeral backend signer.
4. The code defaulted to devnet.
5. Prize yield and APY were fabricated constants.
6. Winner selection could use non-verifiable process randomness.
7. Claimed programs/IDLs in the README were absent from the repositories.
8. Circle and loan lifecycles were incomplete.
9. The phrase “principal always safe” ignored DeFi protocol, USDC and liquidity risk.

The replacement architecture must not reuse these behaviors.

## Preserved product intent

- Full savings product rather than a generic wallet.
- Self-custodial connected wallet and wallet-signed transactions.
- Native Circle-issued Solana USDC only.
- Named personal savings and goals.
- Time-based savings restrictions.
- Prize-linked savings funded by yield rather than saver principal.
- Daily/weekly/monthly prize-cycle concept and time-weighted eligibility as a configurable recovered option.
- On-chain Ajo/ROSCA circles.
- Activity-based, explainable StashScore and microloan eligibility.
- Verification, referrals, settings and unified activity.

## Unresolved product decisions

- Final multi-user prize weighting model and minimum holding/deposit thresholds.
- Verifiable randomness provider and failure/retry rules.
- Exact first strategy/market after current Kamino, Drift and Project 0 diligence.
- TimeLockr recovery design (the current baseline has no admin bypass).
- Circle default handling and whether a guarantee/reserve is ever introduced.
- Initial reputation-loan limits, fee model, default threshold and legal launch scope.
- Whether the old inheritance feature becomes a distinct future product.

These decisions must remain explicit configuration or open issues; they must not be invented invisibly in frontend code.

