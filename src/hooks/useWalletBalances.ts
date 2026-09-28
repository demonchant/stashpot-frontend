import { useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { getMainnetWalletBalances } from '../lib/solana'

export function useWalletBalances() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [usdc, setUsdc] = useState(0)
  const [sol, setSol] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setUsdc(0)
      setSol(0)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const balances = await getMainnetWalletBalances(connection, publicKey)
      setUsdc(balances.usdc)
      setSol(balances.sol)
    } catch (err) {
      console.error('[wallet balance]', err)
      setError('Could not read the wallet from Solana. Try refreshing in a moment.')
    } finally {
      setLoading(false)
    }
  }, [connection, publicKey])

  useEffect(() => {
    refresh()
    const interval = window.setInterval(refresh, 20_000)
    window.addEventListener('wallet-balance:refresh', refresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener('wallet-balance:refresh', refresh)
    }
  }, [refresh])

  return { usdc, sol, loading, error, refresh }
}
