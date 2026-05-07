import { FC, useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { usePrivy, useWallets as usePrivyWallets } from '@privy-io/react-auth'
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react'
import {
  LayoutDashboard, Trophy, Lock, Users, HandCoins,
  Banknote, ShieldCheck, Gift, LogOut, Menu, X, ArrowLeft, Mail,
} from 'lucide-react'
import { cn, shortAddress } from '../lib/utils'
import { useAuthStore } from '../store/auth'
import { useStashpotAuth } from '../hooks/useStashpotAuth'
import { api } from '../lib/api'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { to: '/pools',     label: 'Prize Pools', icon: Trophy },
  { to: '/vaults',    label: 'TimeLockr',   icon: Lock },
  { to: '/circles',   label: 'Circles',     icon: Users },
  { to: '/loans',     label: 'Microloans',  icon: HandCoins },
  { to: '/fiat',      label: 'On Ramp',     icon: Banknote },
  { to: '/verify',    label: 'Verify',      icon: ShieldCheck },
  { to: '/referrals', label: 'Referrals',   icon: Gift },
]

const Layout: FC = () => {
  const navigate = useNavigate()

  // Privy state — primary auth source
  const { authenticated: privyAuthenticated, ready: privyReady, user: privyUser } = usePrivy()
  const { wallets: privyWallets } = usePrivyWallets()

  // Solana wallet adapter — fallback for crypto-natives
  const { connected: solanaConnected, publicKey: solanaPublicKey } = useSolanaWallet()

  // StashPot backend session
  const { isAuthenticated, token, user, setUser } = useAuthStore()
  const { signIn, signOut } = useStashpotAuth()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authPrompted, setAuthPrompted] = useState(false)

  // Determine which auth method the user is on
  const hasAnyAuth = privyAuthenticated || solanaConnected

  // Get the user's Solana wallet address from whichever source is active
  const solanaWalletAddress =
    privyWallets.find((w) => w.walletClientType === 'privy' || w.chainType === 'solana')?.address ||
    privyUser?.wallet?.address ||
    solanaPublicKey?.toString() ||
    ''

  // Auto-trigger backend JWT exchange once Privy/wallet is connected
  useEffect(() => {
    if (hasAnyAuth && !isAuthenticated && !authPrompted && privyReady) {
      setAuthPrompted(true)
      signIn()
    }
    if (!hasAnyAuth) setAuthPrompted(false)
  }, [hasAnyAuth, isAuthenticated, authPrompted, privyReady, signIn])

  // Pull the StashPot user record once authenticated
  useEffect(() => {
    if (isAuthenticated && !user) {
      api.getMe().then(setUser).catch(() => {})
    }
  }, [isAuthenticated, user, setUser])

  // Bounce to landing if user logs out
  useEffect(() => {
    if (privyReady && !hasAnyAuth && !token) navigate('/')
  }, [privyReady, hasAnyAuth, token, navigate])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Loading state while Privy initializes
  if (!privyReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-3 border-royal-600 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm text-ink-500">Loading…</p>
        </div>
      </div>
    )
  }

  // Not signed in at all — show sign-in prompt
  if (!hasAnyAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50 px-6">
        <div className="bg-white rounded-2xl border border-ink-200 shadow-soft-lg max-w-md w-full p-8 text-center">
          <Logo size={56} className="mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-ink-900 mb-2">Sign in to StashPot</h2>
          <p className="text-ink-600 mb-6 text-sm">
            Use your email, Google, or connect a Solana wallet.
          </p>
          <button
            onClick={() => signIn()}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-royal-600 to-royal-700 text-white text-sm font-bold hover:from-royal-700 hover:to-royal-800 transition-all shadow-royal"
          >
            <Mail size={16} />
            Sign in
          </button>
          <Link
            to="/"
            className="mt-4 inline-block text-xs text-ink-500 hover:text-royal-700"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-ink-200 z-50',
          'transform transition-transform duration-300 flex flex-col',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={36} />
            <div>
              <h1 className="font-bold text-ink-900 tracking-tight text-[17px]">StashPot</h1>
              <p className="text-ink-500 text-[10px] uppercase tracking-widest">v1.7 Devnet</p>
            </div>
          </Link>
          <button className="lg:hidden text-ink-500" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive
                    ? 'bg-royal-50 text-royal-700'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ink-100">
          <div className="bg-gradient-to-br from-royal-50 to-gold-50 rounded-xl p-4 mb-3 border border-royal-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-ink-500 text-xs uppercase tracking-wider font-medium">
                {privyUser?.email?.address ? 'Account' : 'Wallet'}
              </span>
              {user?.tier && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-royal-100 text-royal-700 font-medium">
                  {user.tier}
                </span>
              )}
            </div>
            {privyUser?.email?.address ? (
              <p className="text-sm text-ink-900 truncate" title={privyUser.email.address}>
                {privyUser.email.address}
              </p>
            ) : null}
            <p className="font-mono text-xs text-ink-600 mt-1">
              {shortAddress(solanaWalletAddress)}
            </p>
            {user?.composite !== undefined && (
              <div className="mt-2 pt-2 border-t border-royal-200">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-500">StashScore</span>
                  <span className="font-mono text-royal-700 font-semibold">{user.composite}</span>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-ink-200 text-ink-600 hover:text-red-600 hover:border-red-200 transition-all text-sm"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-ink-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button className="lg:hidden text-ink-900" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <Link
              to="/"
              className="hidden lg:flex items-center gap-2 text-sm text-ink-500 hover:text-royal-700"
            >
              <ArrowLeft size={14} /> Back to home
            </Link>
            <div className="text-xs text-ink-500 font-mono">
              {shortAddress(solanaWalletAddress)}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">
          {!isAuthenticated ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin h-6 w-6 border-2 border-royal-600 border-t-transparent rounded-full mx-auto mb-3" />
                <p className="text-ink-600 text-sm">Authenticating with StashPot…</p>
              </div>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}

export default Layout
