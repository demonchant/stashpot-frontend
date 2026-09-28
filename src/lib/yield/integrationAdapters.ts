import type { BuiltYieldAction, PrizeYieldStrategyAdapter, YieldPositionSnapshot, YieldStrategyConfig, YieldVenue } from './types'
import type { ProjectZeroRuntime } from './projectZero'

/**
 * Kamino/Drift strategies routed through Project 0 integration banks.
 * This preserves separate StashPot strategy identities while relying on P0's
 * reviewed integration builders/refresh logic. It is not a direct Kamino or
 * direct Drift custody adapter.
 */
export class ProjectZeroVenueAdapter implements PrizeYieldStrategyAdapter {
  readonly venue: YieldVenue
  constructor(venue: 'kamino' | 'drift', private readonly runtime: ProjectZeroRuntime) { this.venue = venue }

  async readPosition(config: YieldStrategyConfig, owner: string): Promise<YieldPositionSnapshot> {
    this.assertConfig(config)
    const p = await this.runtime.readIntegrationPosition(owner, config.reserve)
    return {
      strategyId: config.id,
      principalAllocatedAtomic: config.principalAllocatedAtomic,
      redeemableValueAtomic: p.depositedAtomic,
      withdrawableValueAtomic: p.withdrawableAtomic,
      accruedValueAtomic: p.depositedAtomic - config.principalAllocatedAtomic,
      supplyApy: p.supplyApy,
      status: config.depositsPaused ? 'deposits-paused' : 'ready',
      observedSlot: p.observedSlot,
    }
  }

  async buildDeposit(config: YieldStrategyConfig, owner: string, amountAtomic: bigint): Promise<BuiltYieldAction> {
    this.assertConfig(config)
    if (config.depositsPaused) throw new Error('Strategy deposits are paused')
    if (amountAtomic <= 0n) throw new Error('Yield action amount must be positive')
    return { strategyId: config.id, kind: 'deposit', transactions: await this.runtime.buildIntegrationDeposit(owner, config.reserve, amountAtomic) }
  }

  async buildWithdraw(config: YieldStrategyConfig, owner: string, amountAtomic: bigint): Promise<BuiltYieldAction> {
    this.assertConfig(config)
    if (amountAtomic <= 0n) throw new Error('Yield action amount must be positive')
    return { strategyId: config.id, kind: 'withdraw', transactions: await this.runtime.buildIntegrationWithdraw(owner, config.reserve, amountAtomic) }
  }

  private assertConfig(config: YieldStrategyConfig) {
    if (config.venue !== this.venue) throw new Error(`Strategy ${config.id} venue mismatch`)
    if (!config.enabled) throw new Error(`Strategy ${config.id} is disabled`)
    if (!config.protocolProgram || !config.market || !config.reserve) throw new Error(`Strategy ${config.id} is not fully allowlisted`)
  }
}
