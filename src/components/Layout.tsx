import { FC, useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useWallet } from '@solana/wallet-adapter-react'
import { ArrowLeft, LayoutDashboard, Menu, ShieldCheck, WalletCards, X } from 'lucide-react'
import { cn, shortAddress } from '../lib/utils'
import { Logo } from './Logo'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/fund', label: 'Fund Wallet', icon: WalletCards },
]

const Layout: FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { publicKey } = useWallet()
  const address = publicKey?.toBase58() || ''

  return (
    <div className="min-h-screen bg-ink-50 flex">
      {sidebarOpen && (
        <button className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Close menu" />
      )}

      <aside className={cn(
        'fixed lg:sticky top-0 left-0 h-screen w-72 bg-white border-r border-ink-200 z-50',
        'transform transition-transform duration-300 flex flex-col',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}>
        <div className="p-6 border-b border-ink-100 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <Logo size={38} />
            <div>
              <h1 className="font-bold text-ink-900 tracking-tight text-[17px]">StashPot</h1>
              <p className="text-accent-700 text-[10px] uppercase tracking-widest font-semibold">Mainnet</p>
            </div>
          </Link>
          <button className="lg:hidden text-ink-500" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all',
                isActive ? 'bg-royal-50 text-royal-700' : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900',
              )}
            >
              <Icon size={18} /> {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-ink-100 space-y-3">
          <div className="rounded-xl border border-accent-200 bg-accent-50 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-accent-800 mb-1"><ShieldCheck size={14} /> Self-custodial</div>
            <p className="text-xs text-ink-600">Balances are read directly from Solana. StashPot cannot access your funds.</p>
          </div>
          <WalletMultiButton className="!w-full !h-auto !py-2.5 !px-4 !rounded-xl !bg-ink-900 !text-sm !justify-center" />
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-ink-100">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button className="lg:hidden text-ink-900" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={24} /></button>
            <Link to="/" className="hidden lg:flex items-center gap-2 text-sm text-ink-500 hover:text-royal-700"><ArrowLeft size={14} /> Back to home</Link>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex px-2 py-1 rounded-full bg-accent-50 text-accent-700 text-[10px] uppercase tracking-wider font-bold">Mainnet</span>
              <span className="text-xs text-ink-500 font-mono">{address ? shortAddress(address) : 'Wallet not connected'}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden"><Outlet /></main>
      </div>
    </div>
  )
}

export default Layout
