import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js'

export const USDC_MAINNET_MINT = new PublicKey(
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
)

export const USDC_MAINNET_MINT_ADDRESS = USDC_MAINNET_MINT.toBase58()

export async function getMainnetWalletBalances(
  connection: Connection,
  owner: PublicKey,
) {
  const [lamports, tokenAccounts] = await Promise.all([
    connection.getBalance(owner, 'confirmed'),
    connection.getParsedTokenAccountsByOwner(
      owner,
      { mint: USDC_MAINNET_MINT },
      'confirmed',
    ),
  ])

  const usdc = tokenAccounts.value.reduce((total, account) => {
    const tokenAmount = account.account.data.parsed.info.tokenAmount
    return total + Number(tokenAmount.uiAmountString || 0)
  }, 0)

  return {
    sol: lamports / LAMPORTS_PER_SOL,
    usdc,
  }
}

export function solscanAccountUrl(address: string) {
  return `https://solscan.io/account/${encodeURIComponent(address)}`
}
