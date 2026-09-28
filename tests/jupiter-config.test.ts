import { describe, expect, it } from 'vitest'
import { USDC_MAINNET_MINT_ADDRESS, WRAPPED_SOL_MINT_ADDRESS } from '../src/lib/solana'

describe('Jupiter swap defaults', () => {
  it('uses different source and destination mints', () => {
    expect(WRAPPED_SOL_MINT_ADDRESS).not.toBe(USDC_MAINNET_MINT_ADDRESS)
    expect(WRAPPED_SOL_MINT_ADDRESS).toBe('So11111111111111111111111111111111111111112')
    expect(USDC_MAINNET_MINT_ADDRESS).toBe('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
  })
})

