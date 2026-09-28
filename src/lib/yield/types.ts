export type YieldVenue = 'kamino' | 'drift' | 'project-zero'

export type StrategyStatus = 'disabled' | 'ready' | 'deposits-paused' | 'withdraw-only' | 'unavailable'

export interface YieldStrategyConfig {
  id: string
  venue: YieldVenue
  allocationBps: number
  protocolProgram: string
  market: string
  reserve: string
  receiptMint?: string
  principalAllocatedAtomic: bigint
  enabled: boolean
  depositsPaused: boolean
}

export interface YieldPositionSnapshot {
  strategyId: string
  principalAllocatedAtomic: bigint
  redeemableValueAtomic: bigint
  withdrawableValueAtomic: bigint
  accruedValueAtomic: bigint
  supplyApy?: number
  status: StrategyStatus
  observedSlot?: number
}

export interface BuiltYieldAction {
  strategyId: string
  kind: 'deposit' | 'withdraw'
  // Serialized transaction/message bytes are intentionally opaque here. The
  // wallet layer owns signing; adapters must never receive a private key.
  transactions: Uint8Array[]
}

export interface PrizeYieldStrategyAdapter {
  readonly venue: YieldVenue
  readPosition(config: YieldStrategyConfig, owner: string): Promise<YieldPositionSnapshot>
  buildDeposit(config: YieldStrategyConfig, owner: string, amountAtomic: bigint): Promise<BuiltYieldAction>
  buildWithdraw(config: YieldStrategyConfig, owner: string, amountAtomic: bigint): Promise<BuiltYieldAction>
}

export function validateStrategyAllocation(configs: YieldStrategyConfig[]): void {
  const enabled = configs.filter((strategy) => strategy.enabled)
  const total = enabled.reduce((sum, strategy) => sum + strategy.allocationBps, 0)
  if (enabled.some((strategy) => strategy.allocationBps < 0 || strategy.allocationBps > 10_000)) {
    throw new Error('Strategy allocation must be between 0 and 10,000 bps')
  }
  if (enabled.length > 0 && total !== 10_000) {
    throw new Error(`Enabled strategy allocation must total 10,000 bps; received ${total}`)
  }
  for (const strategy of enabled) {
    if (!strategy.protocolProgram || !strategy.market || !strategy.reserve) {
      throw new Error(`Strategy ${strategy.id} is missing allowlisted on-chain accounts`)
    }
  }
}

export function allocateAtomic(total: bigint, configs: YieldStrategyConfig[]): Map<string, bigint> {
  validateStrategyAllocation(configs)
  const enabled = configs.filter((strategy) => strategy.enabled)
  const allocations = new Map<string, bigint>()
  let allocated = 0n
  enabled.forEach((strategy, index) => {
    const amount = index === enabled.length - 1
      ? total - allocated
      : (total * BigInt(strategy.allocationBps)) / 10_000n
    allocations.set(strategy.id, amount)
    allocated += amount
  })
  return allocations
}

export function principalSolvent(
  idlePrincipalAtomic: bigint,
  positions: YieldPositionSnapshot[],
  principalLiabilityAtomic: bigint,
): boolean {
  const redeemable = positions.reduce((sum, position) => sum + position.redeemableValueAtomic, 0n)
  return idlePrincipalAtomic + redeemable >= principalLiabilityAtomic
}
