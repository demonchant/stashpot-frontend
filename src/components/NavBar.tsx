import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, WalletCards, X } from 'lucide-react'
import { cn } from '../lib/utils'
import { Logo } from './Logo'

const LINKS = [
  { href: '#funding', label: 'Funding' },
  { href: '#how', label: 'How it works' },
  { href: '#security', label: 'Security' },
  { href: '#faq', label: 'FAQ' },
]

const NavBar: FC = () => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={cn('fixed top-0 inset-x-0 z-50 transition-all duration-300', scrolled ? 'glass border-b border-ink-100 shadow-soft' : 'bg-transparent')}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5"><Logo size={50} /><span className="font-bold tracking-tight text-[18px] text-ink-900">StashPot</span></Link>
        <nav className="hidden lg:flex items-center gap-8">
          {LINKS.map((link) => <a key={link.href} href={link.href} className="text-sm font-medium text-ink-700 hover:text-royal-700 transition-colors">{link.label}</a>)}
        </nav>
        <Link to="/dashboard" className="hidden lg:inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-r from-royal-600 to-royal-700 text-white hover:from-royal-700 hover:to-royal-800 shadow-royal">
          <WalletCards size={15} /> Open app
        </Link>
        <button className="lg:hidden text-ink-900" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">{mobileOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      {mobileOpen && (
        <div className="lg:hidden border-t border-ink-100 bg-white shadow-soft-lg">
          <nav className="px-6 py-4 space-y-3">
            {LINKS.map((link) => <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-base text-ink-700 hover:text-royal-700 py-2 font-medium">{link.label}</a>)}
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-royal-600 to-royal-700 text-white text-sm font-semibold"><WalletCards size={15} /> Open app</Link>
          </nav>
        </div>
      )}
    </header>
  )
}

export default NavBar
