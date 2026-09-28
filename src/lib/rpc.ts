import { clusterApiUrl } from '@solana/web3.js'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'

const DEV_FALLBACK = clusterApiUrl(WalletAdapterNetwork.Mainnet)

export function getMainnetRpcEndpoint(): string {
  const browserEndpoint = import.meta.env.VITE_SOLANA_BROWSER_RPC_URL?.trim()
  if (browserEndpoint) return browserEndpoint

  if (import.meta.env.PROD && typeof window !== 'undefined') {
    return new URL('/api/solana-rpc', window.location.origin).toString()
  }

  return import.meta.env.VITE_SOLANA_MAINNET_RPC_URL?.trim() || DEV_FALLBACK
}

