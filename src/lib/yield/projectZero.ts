import type { PrizeYieldStrategyAdapter, YieldStrategyConfig, YieldPositionSnapshot, BuiltYieldAction } from './types'

export interface ProjectZeroPosition {
  bankAddress: string
  depositedAtomic: bigint
  withdrawableAtomic: bigint
  observedSlot?: number
  supplyApy?: number
}

export interface ProjectZeroRuntime {
  readIntegrationPosition(owner: string, bankAddress: string): Promise<ProjectZeroPosition>
  buildIntegrationDeposit(owner: string, bankAddress: string, amountAtomic: bigint): Promise<Uint8Array[]>
  buildIntegrationWithdraw(owner: string, bankAddress: string, amountAtomic: bigint): Promise<Uint8Array[]>
}

/**
 * Project 0 integration-bank adapter.
 *
 * `config.reserve` is the allowlisted Project 0 integration-bank address. The
 * runtime must verify the live bank mint is native Circle USDC and its asset
 * tag matches the configured venue before returning/building anything.
 * Signing always remains with the connected wallet.
 */
export class ProjectZeroYieldAdapter implements PrizeYieldStrategyAdapter {
  readonly venue = 'project-zero' as const

  constructor(private readonly runtime: ProjectZeroRuntime) {}

  async readPosition(config: YieldStrategyConfig, owner: string): Promise<YieldPositionSnapshot> {
    assertEnabled(config)
    const live = await this.runtime.readIntegrationPosition(owner, config.reserve)
    if (live.bankAddress !== config.reserve) throw new Error('Project 0 returned a non-allowlisted bank')
    const accrued = live.depositedAtomic - config.principalAllocatedAtomic
    return {
      strategyId: config.id,
      principalAllocatedAtomic: config.principalAllocatedAtomic,
      redeemableValueAtomic: live.depositedAtomic,
      withdrawableValueAtomic: live.withdrawableAtomic,
      accruedValueAtomic: accrued,
      supplyApy: live.supplyApy,
      status: config.depositsPaused ? 'deposits-paused' : 'ready',
      observedSlot: live.observedSlot,
    }
  }

  async buildDeposit(config: YieldStrategyConfig, owner: string, amountAtomic: bigint): Promise<BuiltYieldAction> {
    assertEnabled(config)
    if (config.depositsPaused) throw new Error('Strategy deposits are paused')
    assertPositive(amountAtomic)
    return { strategyId: config.id, kind: 'deposit', transactions: await this.runtime.buildIntegrationDeposit(owner, config.reserve, amountAtomic) }
  }

  async buildWithdraw(config: YieldStrategyConfig, owner: string, amountAtomic: bigint): Promise<BuiltYieldAction> {
    assertEnabled(config)
    assertPositive(amountAtomic)
    return { strategyId: config.id, kind: 'withdraw', transactions: await this.runtime.buildIntegrationWithdraw(owner, config.reserve, amountAtomic) }
  }
}

function assertEnabled(config: YieldStrategyConfig) {
  if (!config.enabled) throw new Error(`Strategy ${config.id} is disabled`)
  if (!config.protocolProgram || !config.market || !config.reserve) throw new Error(`Strategy ${config.id} is not fully allowlisted`)
}
function assertPositive(amount: bigint) { if (amount <= 0n) throw new Error('Yield action amount must be positive') }
