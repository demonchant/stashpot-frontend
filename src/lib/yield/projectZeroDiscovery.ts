import { PublicKey } from '@solana/web3.js'

export const NATIVE_USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
export const PROJECT_ZERO_SDK_VERSION = '2.8.4'

export type P0Venue = 'kamino' | 'drift'
export interface DiscoveredIntegrationBank {
  venue: P0Venue
  address: string
  mint: string
  assetTag: number
  operationalState: string
  depositAllowed: boolean
  reason?: string
}

/** Discover addresses from live Project 0 state instead of hard-coding a stale bank.
 * Drift is intentionally withdraw-only/disabled until Project 0's security notice
 * says the replacement venue is operational. */
export function discoverUsdcIntegrationBanks(client: any): DiscoveredIntegrationBank[] {
  const tags = [{ venue: 'kamino' as const, tag: 3 }, { venue: 'drift' as const, tag: 4 }]
  return tags.flatMap(({ venue, tag }) => {
    const banks = client.getBanksByMint(NATIVE_USDC_MINT, tag) ?? []
    return banks.map((bank: any) => {
      const state = String(bank.config?.operationalState ?? 'unknown')
      const live = !/paused|reduce|non.?operational|disabled/i.test(state)
      const driftSafetyHold = venue === 'drift'
      return {
        venue,
        address: bank.address.toBase58(),
        mint: bank.mint.toBase58(),
        assetTag: Number(bank.config?.assetTag),
        operationalState: state,
        depositAllowed: live && !driftSafetyHold,
        reason: driftSafetyHold ? 'Drift deposits disabled by StashPot safety policy pending venue restart/reverification' : live ? undefined : `Project 0 bank state is ${state}`,
      }
    })
  })
}

export function assertApprovedLiveBank(bank: DiscoveredIntegrationBank, expectedVenue: P0Venue, allowlist: ReadonlySet<string>) {
  if (bank.venue !== expectedVenue) throw new Error('Project 0 venue mismatch')
  if (bank.mint !== NATIVE_USDC_MINT.toBase58()) throw new Error('Integration bank is not native Circle USDC')
  if (!allowlist.has(bank.address)) throw new Error('Integration bank is not in the StashPot production allowlist')
  if (!bank.depositAllowed) throw new Error(bank.reason || 'Integration bank is not open for deposits')
}
