import { describe, expect, it } from 'vitest'
import { PRODUCT_ROUTE_PATHS } from '../src/config/product'

describe('product route contract', () => {
  it('keeps every required StashPot product route present and unique', () => {
    expect(PRODUCT_ROUTE_PATHS).toEqual([
      '/dashboard', '/fund', '/savings', '/goals', '/timelock', '/prize',
      '/circles', '/microloans', '/activity', '/withdrawals', '/referrals',
      '/verify', '/settings',
    ])
    expect(new Set(PRODUCT_ROUTE_PATHS).size).toBe(PRODUCT_ROUTE_PATHS.length)
  })

  it('never includes a devnet route', () => {
    expect(PRODUCT_ROUTE_PATHS.some((path) => path.toLowerCase().includes('devnet'))).toBe(false)
  })
})

