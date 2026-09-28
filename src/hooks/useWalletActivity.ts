import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'

export type WalletActivity = {
  signature: string
  timestamp: number | null
  slot: number
  status: 'confirmed' | 'failed'
  type: 'WALLET_TRANSACTION'
}

export function useWalletActivity(limit = 25) {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [items, setItems] = useState<WalletActivity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setItems([])
      setError(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit }, 'confirmed')
      setItems(signatures.map((entry) => ({
        signature: entry.signature,
        timestamp: entry.blockTime,
        slot: entry.slot,
        status: entry.err ? 'failed' : 'confirmed',
        type: 'WALLET_TRANSACTION',
      })))
    } catch (activityError) {
      console.error('[wallet activity]', activityError)
      setError('Could not retrieve this wallet’s mainnet signatures. No activity was fabricated.')
    } finally {
      setLoading(false)
    }
  }, [connection, limit, publicKey])

  useEffect(() => { refresh() }, [refresh])
  return { items, loading, error, refresh }
}

