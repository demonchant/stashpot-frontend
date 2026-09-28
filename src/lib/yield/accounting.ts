import type { YieldPositionSnapshot } from './types'

export interface PrizeYieldLedger {
  principalLiabilityAtomic: bigint
  idlePrincipalAtomic: bigint
  realizedRewardReserveAtomic: bigint
  lifetimeRealizedYieldAtomic: bigint
  lifetimeStrategyLossAtomic: bigint
}

export interface HarvestResult {
  ledger: PrizeYieldLedger
  realizedRewardAtomic: bigint
  principalReturnedAtomic: bigint
  lossRealizedAtomic: bigint
}

export function totalRedeemableAtomic(positions: YieldPositionSnapshot[]): bigint {
  return positions.reduce((sum, p) => sum + p.redeemableValueAtomic, 0n)
}

export function totalWithdrawableAtomic(positions: YieldPositionSnapshot[]): bigint {
  return positions.reduce((sum, p) => sum + p.withdrawableValueAtomic, 0n)
}

export function accountingSolvent(ledger: PrizeYieldLedger, positions: YieldPositionSnapshot[]): boolean {
  return ledger.idlePrincipalAtomic + totalRedeemableAtomic(positions) >= ledger.principalLiabilityAtomic
}

/**
 * Applies USDC actually returned by a strategy withdrawal/harvest.
 * Principal is replenished first. Only cash above the strategy's recorded
 * principal allocation can become realized reward. A mark-to-market gain is
 * never distributable by this function.
 */
export function realizeStrategyWithdrawal(
  ledger: PrizeYieldLedger,
  principalAllocatedAtomic: bigint,
  usdcReturnedAtomic: bigint,
): HarvestResult {
  if (principalAllocatedAtomic < 0n || usdcReturnedAtomic < 0n) throw new Error('Negative yield accounting input')

  const principalReturnedAtomic = usdcReturnedAtomic > principalAllocatedAtomic
    ? principalAllocatedAtomic
    : usdcReturnedAtomic
  const realizedRewardAtomic = usdcReturnedAtomic > principalAllocatedAtomic
    ? usdcReturnedAtomic - principalAllocatedAtomic
    : 0n
  const lossRealizedAtomic = usdcReturnedAtomic < principalAllocatedAtomic
    ? principalAllocatedAtomic - usdcReturnedAtomic
    : 0n

  return {
    principalReturnedAtomic,
    realizedRewardAtomic,
    lossRealizedAtomic,
    ledger: {
      ...ledger,
      idlePrincipalAtomic: ledger.idlePrincipalAtomic + principalReturnedAtomic,
      realizedRewardReserveAtomic: ledger.realizedRewardReserveAtomic + realizedRewardAtomic,
      lifetimeRealizedYieldAtomic: ledger.lifetimeRealizedYieldAtomic + realizedRewardAtomic,
      lifetimeStrategyLossAtomic: ledger.lifetimeStrategyLossAtomic + lossRealizedAtomic,
    },
  }
}

export function assertRewardDistributionAllowed(
  ledger: PrizeYieldLedger,
  positions: YieldPositionSnapshot[],
  requestedRewardAtomic: bigint,
): void {
  if (requestedRewardAtomic <= 0n) throw new Error('Reward must be positive')
  if (!accountingSolvent(ledger, positions)) throw new Error('Prize principal is insolvent; reward distribution is blocked')
  if (requestedRewardAtomic > ledger.realizedRewardReserveAtomic) throw new Error('Reward exceeds realized reward reserve')
}
