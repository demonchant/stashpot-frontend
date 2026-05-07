import { useCallback } from 'react'
import { usePrivy, useWallets, useLogin } from '@privy-io/react-auth'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'

/**
 * Unified auth hook that supports BOTH:
 *
 * 1. Privy (primary) — email magic link, Google, passkey, Phantom/Solflare
 *    via Privy's connectors. After Privy login, we exchange Privy's ID token
 *    for a StashPot JWT.
 *
 * 2. Solana wallet adapter (fallback) — direct Phantom/Solflare connection
 *    without going through Privy. Uses Ed25519 signature verification.
 *
 * Most users will use path 1. Path 2 stays for crypto-native users who
 * want a fully decentralized auth flow with no third-party SDK.
 */
export function useStashpotAuth() {
  const { ready, authenticated, getAccessToken, logout: privyLogout, user: privyUser } = usePrivy()
  const { wallets: privyWallets } = useWallets()
  const { publicKey, signMessage, disconnect: solanaDisconnect } = useSolanaWallet()
  const { setAuth, logout } = useAuthStore()

  // Privy-managed login flow (opens the Privy modal with all configured methods)
  const { login: privyLogin } = useLogin({
    onComplete: async (user) => {
      try {
        const idToken = await getAccessToken()
        if (!idToken) {
          toast.error('Could not retrieve auth token from Privy')
          return
        }

        // Find the user's Solana wallet (embedded or linked external)
        const solanaWallet =
          user?.wallet?.chainType === 'solana'
            ? user.wallet.address
            : privyWallets.find(
                (w) =>
                  w.walletClientType === 'privy' || w.walletClientType === 'phantom',
              )?.address

        const { token, user: stashUser } = await api.verifyPrivy(idToken, solanaWallet)
        api.setToken(token)
        setAuth(token, stashUser)
        toast.success(`Welcome${stashUser?.username ? `, ${stashUser.username}` : ''}!`)
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Sign-in failed')
      }
    },
    onError: (error) => {
      // Privy returns a structured error object — most errors are user cancellations
      if (error !== 'exited_auth_flow' && error !== 'user_exited_auth_flow') {
        toast.error('Authentication error. Please try again.')
        console.error('[privy login error]', error)
      }
    },
  })

  /**
   * Primary entry — opens the Privy modal so the user can pick:
   * email, Google, Apple, passkey, Phantom, Solflare, Backpack, etc.
   */
  const signInWithPrivy = useCallback(async () => {
    if (!ready) {
      toast.error('Auth still loading. Please wait a moment.')
      return false
    }
    if (authenticated) {
      // Already logged in to Privy — just exchange the token
      try {
        const idToken = await getAccessToken()
        if (!idToken) return false
        const solanaWallet = privyWallets.find((w) => w.walletClientType === 'privy')?.address
        const { token, user } = await api.verifyPrivy(idToken, solanaWallet)
        api.setToken(token)
        setAuth(token, user)
        toast.success('Signed in')
        return true
      } catch (err: any) {
        toast.error(err?.response?.data?.error || 'Sign-in failed')
        return false
      }
    }
    privyLogin()
    return true
  }, [ready, authenticated, getAccessToken, privyLogin, privyWallets, setAuth])

  /**
   * Fallback — pure Solana wallet adapter signature flow (no Privy).
   * Only works if the user has connected via WalletMultiButton already.
   */
  const signInWithWallet = useCallback(async () => {
    if (!publicKey || !signMessage) {
      toast.error('Connect a Solana wallet first')
      return false
    }
    try {
      const wallet = publicKey.toString()
      const { nonce } = await api.getNonce(wallet)
      const message = new TextEncoder().encode(nonce)
      const signature = await signMessage(message)
      const sigB58 = bs58.encode(signature)
      const { token, user } = await api.verifySignature(wallet, sigB58, nonce)
      api.setToken(token)
      setAuth(token, user)
      toast.success('Signed in')
      return true
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Sign-in failed')
      return false
    }
  }, [publicKey, signMessage, setAuth])

  /** Smart sign-in — uses Privy if ready, else falls back to wallet adapter */
  const signIn = useCallback(async () => {
    if (ready) return signInWithPrivy()
    return signInWithWallet()
  }, [ready, signInWithPrivy, signInWithWallet])

  const signOut = useCallback(async () => {
    api.clearToken()
    logout()
    try {
      if (authenticated) await privyLogout()
    } catch {}
    try {
      await solanaDisconnect()
    } catch {}
    toast.success('Signed out')
  }, [authenticated, privyLogout, solanaDisconnect, logout])

  return {
    signIn,
    signInWithPrivy,
    signInWithWallet,
    signOut,
    privyReady: ready,
    privyAuthenticated: authenticated,
    privyUser,
  }
}
