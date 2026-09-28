import { useCallback, useEffect, useRef, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { getMainnetWalletBalances } from '../lib/solana'

export function useWalletBalances() {
  const { connection } = useConnection()
  const { publicKey } = useWallet()
  const [usdc, setUsdc] = useState(0)
  const [sol, setSol] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)
  const activeRequest = useRef(0)

  const refresh = useCallback(async () => {
    if (!publicKey) {
      setUsdc(0)
      setSol(0)
      setError(null)
      return
    }

    const requestId = ++activeRequest.current
    setLoading(true)
    setError(null)
    try {
      const balances = await getMainnetWalletBalances(connection, publicKey)
      if (requestId !== activeRequest.current) return
      setUsdc(balances.usdc)
      setSol(balances.sol)
      setUpdatedAt(new Date())
    } catch (err) {
      console.error('[wallet balance]', err)
      if (requestId === activeRequest.current) {
        setError('Solana mainnet RPC did not return a valid balance after retries. No balance was estimated or substituted.')
      }
    } finally {
      if (requestId === activeRequest.current) setLoading(false)
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

  return { usdc, sol, loading, error, updatedAt, refresh }
}
