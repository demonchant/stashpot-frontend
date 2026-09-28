import { describe, expect, it } from 'vitest'
import { accountingSolvent, assertRewardDistributionAllowed, realizeStrategyWithdrawal, type PrizeYieldLedger } from '../src/lib/yield/accounting'
import type { YieldPositionSnapshot } from '../src/lib/yield/types'

const ledger: PrizeYieldLedger = { principalLiabilityAtomic: 1_000n, idlePrincipalAtomic: 100n, realizedRewardReserveAtomic: 0n, lifetimeRealizedYieldAtomic: 0n, lifetimeStrategyLossAtomic: 0n }
const position = (redeemable: bigint): YieldPositionSnapshot => ({ strategyId: 'p0', principalAllocatedAtomic: 900n, redeemableValueAtomic: redeemable, withdrawableValueAtomic: redeemable, accruedValueAtomic: redeemable - 900n, status: 'ready' })

describe('Prize yield accounting', () => {
  it('does not treat unrealized appreciation as a reward reserve', () => {
    expect(accountingSolvent(ledger, [position(920n)])).toBe(true)
    expect(() => assertRewardDistributionAllowed(ledger, [position(920n)], 1n)).toThrow(/realized reward reserve/)
  })
  it('replenishes principal before recognizing realized yield', () => {
    const result = realizeStrategyWithdrawal(ledger, 900n, 925n)
    expect(result.principalReturnedAtomic).toBe(900n)
    expect(result.realizedRewardAtomic).toBe(25n)
    expect(result.ledger.idlePrincipalAtomic).toBe(1_000n)
    expect(result.ledger.realizedRewardReserveAtomic).toBe(25n)
  })
  it('records losses rather than fabricating yield', () => {
    const result = realizeStrategyWithdrawal(ledger, 900n, 850n)
    expect(result.realizedRewardAtomic).toBe(0n)
    expect(result.lossRealizedAtomic).toBe(50n)
    expect(result.ledger.lifetimeStrategyLossAtomic).toBe(50n)
  })
  it('blocks reward distribution while principal is insolvent', () => {
    const funded = { ...ledger, realizedRewardReserveAtomic: 50n }
    expect(() => assertRewardDistributionAllowed(funded, [position(850n)], 10n)).toThrow(/insolvent/)
  })
})
