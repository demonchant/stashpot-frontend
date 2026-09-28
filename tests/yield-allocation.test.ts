import { describe, expect, it } from 'vitest'
import { allocateAtomic, principalSolvent, validateStrategyAllocation, type YieldStrategyConfig } from '../src/lib/yield/types'

const base = (id: string, allocationBps: number): YieldStrategyConfig => ({
  id, venue: 'project-zero', allocationBps, protocolProgram: 'program', market: 'market', reserve: 'reserve', enabled: true, depositsPaused: false, principalAllocatedAtomic: 0n,
})

describe('Prize yield allocation invariants', () => {
  it('requires enabled allocations to total 100%', () => {
    expect(() => validateStrategyAllocation([base('a', 4000), base('b', 3000)])).toThrow(/10,000/)
  })

  it('allocates every atomic unit without rounding loss', () => {
    const result = allocateAtomic(101n, [base('a', 4000), base('b', 3000), base('c', 3000)])
    expect([...result.values()].reduce((a, b) => a + b, 0n)).toBe(101n)
  })

  it('blocks rewards when redeemable assets do not cover principal liabilities', () => {
    expect(principalSolvent(100n, [{ strategyId: 'a', principalAllocatedAtomic: 900n, redeemableValueAtomic: 850n, withdrawableValueAtomic: 800n, accruedValueAtomic: -50n, status: 'ready' }], 1_000n)).toBe(false)
  })
})
