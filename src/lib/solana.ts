import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export const USDC_MAINNET_MINT = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
)

export const USDC_MAINNET_MINT_ADDRESS = USDC_MAINNET_MINT.toBase58()
export const WRAPPED_SOL_MINT_ADDRESS = 'So11111111111111111111111111111111111111112'

const RETRY_DELAYS_MS = [250, 750]

async function retry<T>(operation: () => Promise<T>): Promise<T> {
  let lastError: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      if (attempt < RETRY_DELAYS_MS.length) {
        await new Promise((resolve) => window.setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
      }
    }
  }
  throw lastError
}

export async function getMainnetWalletBalances(
  connection: Connection,
  owner: PublicKey,
) {
  const [lamports, tokenAccounts] = await Promise.all([
    retry(() => connection.getBalance(owner, 'confirmed')),
    retry(() => connection.getParsedTokenAccountsByOwner(
      owner,
      { mint: USDC_MAINNET_MINT },
      'confirmed',
    )),
  ])

  const usdcAtomic = tokenAccounts.value.reduce((total, account) => {
    const tokenAmount = account.account.data.parsed.info.tokenAmount
    if (tokenAmount.decimals !== 6 || typeof tokenAmount.amount !== 'string') return total
    return total + BigInt(tokenAmount.amount)
  }, 0n)

  return {
    sol: lamports / LAMPORTS_PER_SOL,
    usdc: Number(usdcAtomic) / 1_000_000,
  }
}

export function solscanAccountUrl(address: string) {
  return `https://solscan.io/account/${encodeURIComponent(address)}`
}

export function solscanTransactionUrl(signature: string) {
  return `https://solscan.io/tx/${encodeURIComponent(signature)}`
}

export async function waitForSignatureConfirmation(
  connection: Connection,
  signature: string,
  attempts = 24,
  intervalMs = 1_500,
) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const response = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    })
    const status = response.value[0]
    if (status?.err) throw new Error('The swap transaction failed on Solana')
    if (status?.confirmationStatus === 'confirmed' || status?.confirmationStatus === 'finalized') {
      return status
    }
    await new Promise((resolve) => window.setTimeout(resolve, intervalMs))
  }
  throw new Error('The swap was submitted but confirmation timed out')
}
