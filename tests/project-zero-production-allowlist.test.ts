import { describe, expect, it } from 'vitest'
import {
  PROJECT_ZERO_DRIFT_USDC_BANK_ALLOWLIST,
  PROJECT_ZERO_KAMINO_USDC_BANK_ALLOWLIST,
} from '../src/lib/yield/productionAllowlist'

describe('production Project 0 allowlist safety', () => {
  it('does not silently trust a discovered Kamino bank before live review', () => {
    expect(PROJECT_ZERO_KAMINO_USDC_BANK_ALLOWLIST.size).toBe(0)
  })

  it('keeps Drift disabled', () => {
    expect(PROJECT_ZERO_DRIFT_USDC_BANK_ALLOWLIST.size).toBe(0)
  })
})
