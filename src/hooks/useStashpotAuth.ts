import { useCallback } from 'react'
import { usePrivy, useLogin } from '@privy-io/react-auth'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import bs58 from 'bs58'
import toast from 'react-hot-toast'
import { api } from '../lib/api'
import { useAuthStore } from '../store/auth'

export function useStashpotAuth() {
  const { ready, authenticated, getAccessToken, logout: privyLogout, user: privyUser } = usePrivy()
  const { publicKey, signMessage, disconnect: solanaDisconnect } = useSolanaWallet()
  const { setAuth, logout } = useAuthStore()

  const { login: privyLogin } = useLogin({
    onComplete: async (user) => {
      try {
        const idToken = await getAccessToken()
        if (!idToken) {
          toast.error('Could not retrieve auth token from Privy')
          return
        }

        // Find Solana wallet from linkedAccounts (Privy v3)
        const solanaWallet = user?.linkedAccounts?.find(
          (account: any) => account.type === 'wallet' && account.chainType === 'solana'
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
      if (error !== 'exited_auth_flow' && error !== 'user_exited_auth_flow') {
        toast.error('Authentication error. Please try again.')
        console.error('[privy login error]', error)
      }
    },
  })

  const signInWithPrivy = useCallback(async () => {
    if (!ready) {
      toast.error('Auth still loading. Please wait a moment.')
      return false
    }
    if (authenticated) {
      try {
        const idToken = await getAccessToken()
        if (!idToken) return false
        
        const solanaWallet = privyUser?.linkedAccounts?.find(
          (account: any) => account.type === 'wallet' && account.chainType === 'solana'
        )?.address
        
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
  }, [ready, authenticated, getAccessToken, privyLogin, privyUser, setAuth])

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
