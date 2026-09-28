import type { Connection, PublicKey } from '@solana/web3.js'
import { Keypair } from '@solana/web3.js'
import { describe, expect, it, vi } from 'vitest'
import {
  getMainnetWalletBalances,
  solscanAccountUrl,
  solscanTransactionUrl,
  USDC_MAINNET_MINT_ADDRESS,
  waitForSignatureConfirmation,
} from '../src/lib/solana'

describe('mainnet wallet balances', () => {
  it('reads SOL and sums only six-decimal accounts returned for the native USDC mint', async () => {
    const owner = Keypair.generate().publicKey
    const getBalance = vi.fn().mockResolvedValue(2_500_000_000)
    const getParsedTokenAccountsByOwner = vi.fn().mockResolvedValue({
      value: [
        { account: { data: { parsed: { info: { tokenAmount: { amount: '1250000', decimals: 6 } } } } } },
        { account: { data: { parsed: { info: { tokenAmount: { amount: '250000', decimals: 6 } } } } } },
        { account: { data: { parsed: { info: { tokenAmount: { amount: '999', decimals: 9 } } } } } },
      ],
    })
    const connection = { getBalance, getParsedTokenAccountsByOwner } as unknown as Connection

    await expect(getMainnetWalletBalances(connection, owner)).resolves.toEqual({ sol: 2.5, usdc: 1.5 })
    expect(getParsedTokenAccountsByOwner).toHaveBeenCalledOnce()
    const mint = getParsedTokenAccountsByOwner.mock.calls[0][1].mint as PublicKey
    expect(mint.toBase58()).toBe(USDC_MAINNET_MINT_ADDRESS)
  })

  it('creates mainnet Solscan links without a devnet query', () => {
    expect(solscanAccountUrl('abc')).toBe('https://solscan.io/account/abc')
    expect(solscanTransactionUrl('sig')).toBe('https://solscan.io/tx/sig')
  })

  it('accepts confirmed signatures and rejects failed signatures', async () => {
    const confirmed = {
      getSignatureStatuses: vi.fn().mockResolvedValue({
        value: [{ err: null, confirmationStatus: 'confirmed' }],
      }),
    } as unknown as Connection
    await expect(waitForSignatureConfirmation(confirmed, 'sig', 1, 0)).resolves.toMatchObject({
      confirmationStatus: 'confirmed',
    })

    const failed = {
      getSignatureStatuses: vi.fn().mockResolvedValue({
        value: [{ err: { InstructionError: [0, 'Custom'] }, confirmationStatus: 'confirmed' }],
      }),
    } as unknown as Connection
    await expect(waitForSignatureConfirmation(failed, 'sig', 1, 0)).rejects.toThrow(/failed/)
  })
})

