import { describe, expect, it } from 'vitest'
import { discoverUsdcIntegrationBanks } from '../src/lib/yield/projectZeroDiscovery'

const mint = { toBase58: () => 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }
const bank = (address: string, tag: number, state = 'Operational') => ({ address: { toBase58: () => address }, mint, config: { assetTag: tag, operationalState: state } })

describe('Project 0 integration discovery', () => {
  it('allows operational Kamino discovery but fail-closes Drift deposits', () => {
    const client = { getBanksByMint: (_mint: unknown, tag: number) => tag === 3 ? [bank('kamino-usdc', 3)] : [bank('drift-usdc', 4)] }
    const result = discoverUsdcIntegrationBanks(client)
    expect(result[0]).toMatchObject({ venue: 'kamino', depositAllowed: true })
    expect(result[1]).toMatchObject({ venue: 'drift', depositAllowed: false })
  })
  it('rejects paused Kamino banks for deposits', () => {
    const client = { getBanksByMint: (_mint: unknown, tag: number) => tag === 3 ? [bank('kamino-usdc', 3, 'Paused')] : [] }
    expect(discoverUsdcIntegrationBanks(client)[0].depositAllowed).toBe(false)
  })
})
