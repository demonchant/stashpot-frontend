import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Github } from 'lucide-react'
import { Logo } from './Logo'

const Footer: FC = () => (
  <footer className="bg-ink-950 text-ink-300 py-12">
    <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
      <div>
        <Link to="/" className="flex items-center gap-2.5 mb-3"><Logo size={32} /><span className="font-bold text-white text-[18px]">StashPot</span></Link>
        <p className="text-sm text-ink-400 max-w-md">A self-custodial personal USDC dashboard on Solana mainnet. Your wallet holds the funds; StashPot only reads public on-chain balances.</p>
      </div>
      <div className="flex flex-wrap items-center gap-5 text-sm">
        <Link to="/dashboard" className="hover:text-white">Dashboard</Link>
        <Link to="/fund" className="hover:text-white">Fund wallet</Link>
        <a href="https://github.com/demonchant/stashpot-frontend" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-white"><Github size={15} /> Source</a>
      </div>
    </div>
    <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-8 pt-6 border-t border-ink-800 flex flex-col sm:flex-row justify-between gap-2 text-xs text-ink-500">
      <span>© {new Date().getFullYear()} StashPot</span><span className="font-mono">Solana mainnet · Native USDC</span>
    </div>
  </footer>
)

export default Footer
