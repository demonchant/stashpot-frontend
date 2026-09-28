import { describe, expect, it } from 'vitest'
import { simulateProjectZeroWithdraw } from '../src/lib/yield/liquiditySimulation'

describe('Project 0 withdrawal preflight', () => {
  it('does not build a transaction above SDK max withdraw', async () => {
    let built = false
    const wrapped = { computeMaxWithdrawForBank: () => ({ toString: () => '4.25' }) }
    const result = await simulateProjectZeroWithdraw({} as any, wrapped, '11111111111111111111111111111111', 4_250_001n, async () => { built = true; return {} as any })
    expect(result.executable).toBe(false)
    expect(result.sdkMaximumAtomic).toBe(4_250_000n)
    expect(built).toBe(false)
  })
})
