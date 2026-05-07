import { FC, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { useWallet } from '@solana/wallet-adapter-react'
import { Menu, X, LogIn } from 'lucide-react'
import { cn } from '../lib/utils'
import { Logo } from './Logo'
import { useStashpotAuth } from '../hooks/useStashpotAuth'
import { useAuthStore } from '../store/auth'

const LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how',      label: 'How it works' },
  { href: '#security', label: 'Security' },
  { href: '#faq',      label: 'FAQ' },
]

const NavBar: FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  const { authenticated, ready } = usePrivy()
  const { connected: walletConnected } = useWallet()
  const { token } = useAuthStore()
  const { signIn } = useStashpotAuth()

  // Logged in if either Privy or our backend has a session
  const loggedIn = !!token || authenticated || walletConnected

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleAuthClick = async () => {
    if (loggedIn) {
      navigate('/dashboard')
      return
    }
    // signIn() opens the Privy modal — picks email, Google, passkey, Phantom, etc.
    await signIn()
  }

  const ctaLabel = loggedIn ? 'Open App' : 'Sign in'

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled ? 'glass border-b border-ink-100 shadow-soft' : 'bg-transparent',
      )}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <Logo size={84} />
          <span className="font-bold tracking-tight text-[18px] text-ink-900">
            StashPot
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className={cn(
                'text-sm font-medium transition-colors',
                scrolled ? 'text-ink-600 hover:text-royal-700' : 'text-ink-700 hover:text-royal-700',
              )}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={handleAuthClick}
            disabled={!ready && !walletConnected}
            className={cn(
              'inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-royal',
              'bg-gradient-to-r from-royal-600 to-royal-700 text-white',
              'hover:from-royal-700 hover:to-royal-800',
              'disabled:opacity-60 disabled:cursor-wait',
            )}
          >
            {!loggedIn && <LogIn size={14} />}
            {ctaLabel}
            {loggedIn && <span aria-hidden>→</span>}
          </button>
        </div>

        <button
          className="lg:hidden text-ink-900"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden border-t border-ink-100 bg-white shadow-soft-lg">
          <nav className="px-6 py-4 space-y-3">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMobileOpen(false)}
                className="block text-base text-ink-700 hover:text-royal-700 py-2 font-medium"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-ink-100">
              <button
                onClick={() => {
                  setMobileOpen(false)
                  handleAuthClick()
                }}
                disabled={!ready && !walletConnected}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-royal-600 to-royal-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {!loggedIn && <LogIn size={14} />}
                {ctaLabel}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}

export default NavBar
