import { describe, expect, it } from 'vitest'
import { atomicUsdcToUi, uiUsdcToAtomic } from '../src/lib/yield/projectZeroSdkRuntime'

describe('Project 0 USDC amount conversion', () => {
  it('converts atomic amounts without floating point rounding', () => {
    expect(atomicUsdcToUi(1_234_567n)).toBe('1.234567')
    expect(atomicUsdcToUi(1_000_000n)).toBe('1')
    expect(uiUsdcToAtomic('1.234567')).toBe(1_234_567n)
  })
  it('rejects more than six decimals', () => {
    expect(() => uiUsdcToAtomic('1.0000001')).toThrow(/Invalid/)
  })
})
