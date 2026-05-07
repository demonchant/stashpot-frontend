import { FC } from 'react'
import { Link } from 'react-router-dom'
import { Github, Twitter, Send } from 'lucide-react'
import { Logo } from './Logo'

const Footer: FC = () => (
  <footer className="bg-ink-950 text-ink-300 pt-20 pb-10">
    <div className="max-w-7xl mx-auto px-6 lg:px-10">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
        <div className="col-span-2 lg:col-span-2">
          <Link to="/" className="flex items-center gap-2.5 mb-4">
            <Logo size={32} />
            <span className="font-bold text-white text-[18px] tracking-tight">StashPot</span>
          </Link>
          <p className="text-sm text-ink-400 max-w-sm leading-relaxed">
            A savings protocol on Solana. Earn yield, enter prize draws, and keep full control of your principal at every step.
          </p>
          <div className="flex gap-3 mt-6">
            <a
              href="https://twitter.com/stashpot"
              className="w-9 h-9 rounded-lg border border-ink-800 hover:border-royal-500 hover:text-royal-400 flex items-center justify-center transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={16} />
            </a>
            <a
              href="https://github.com/stashpot"
              className="w-9 h-9 rounded-lg border border-ink-800 hover:border-royal-500 hover:text-royal-400 flex items-center justify-center transition-colors"
              aria-label="GitHub"
            >
              <Github size={16} />
            </a>
            <a
              href="https://t.me/stashpot"
              className="w-9 h-9 rounded-lg border border-ink-800 hover:border-royal-500 hover:text-royal-400 flex items-center justify-center transition-colors"
              aria-label="Telegram"
            >
              <Send size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/pools" className="hover:text-white transition-colors">Prize Pools</Link></li>
            <li><Link to="/vaults" className="hover:text-white transition-colors">TimeLockr</Link></li>
            <li><Link to="/circles" className="hover:text-white transition-colors">Savings Circles</Link></li>
            <li><Link to="/loans" className="hover:text-white transition-colors">Microloans</Link></li>
            <li><Link to="/fiat" className="hover:text-white transition-colors">Fiat On Ramp</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Resources</h4>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/verify" className="hover:text-white transition-colors">Verify Draws</Link></li>
            <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Audit Reports</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Whitepaper</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-semibold text-sm mb-4">Company</h4>
          <ul className="space-y-2.5 text-sm">
            <li><a href="#" className="hover:text-white transition-colors">About</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
            <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
          </ul>
        </div>
      </div>

      <div className="pt-8 border-t border-ink-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <p className="text-xs text-ink-500">
          © {new Date().getFullYear()} StashPot. All rights reserved.
        </p>
        <p className="text-xs text-ink-500 font-mono">
          v1.7 · Devnet · Built for Colosseum Solana Frontier
        </p>
      </div>
    </div>
  </footer>
)

export default Footer
