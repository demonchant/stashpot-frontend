/**
 * Production strategy allowlist.
 *
 * Deliberately empty until `npm run p0:discover-mainnet` is executed against
 * the production Project 0 group and the discovered Kamino native-USDC bank
 * passes the review checklist in docs/PHASE5_SECURITY_AND_VALIDATION.md.
 * Discovery MUST NOT auto-populate this set.
 */
export const PROJECT_ZERO_KAMINO_USDC_BANK_ALLOWLIST = new Set<string>()

/** Drift remains disabled while Project 0 reports its Drift banks non-operational. */
export const PROJECT_ZERO_DRIFT_USDC_BANK_ALLOWLIST = new Set<string>()
