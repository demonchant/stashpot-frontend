import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  Activity, Check, Copy, ExternalLink, HandCoins, LockKeyhole, PiggyBank,
  RefreshCw, ShieldCheck, Sparkles, Trophy, Users, Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/Button'
import { Card, StatCard } from '../components/Card'
import { UnavailableValue } from '../components/ProgramGate'
import { SEO } from '../components/SEO'
import { useWalletBalances } from '../hooks/useWalletBalances'
import { solscanAccountUrl, USDC_MAINNET_MINT_ADDRESS } from '../lib/solana'
import { formatUSDC, shortAddress } from '../lib/utils'

const PRODUCTS = [
  { to: '/savings', label: 'Savings Pots', description: 'Flexible USDC pots', icon: PiggyBank },
  { to: '/timelock', label: 'TimeLockr', description: 'Program-enforced locks', icon: LockKeyhole },
  { to: '/prize', label: 'Prize Savings', description: 'Yield-backed rewards', icon: Trophy },
  { to: '/circles', label: 'Circles', description: 'Solo test and ROSCA', icon: Users },
  { to: '/microloans', label: 'Microloans', description: 'Activity-based eligibility', icon: HandCoins },
  { to: '/activity', label: 'Activity', description: 'Mainnet signatures', icon: Activity },
]

export default function Dashboard() {
  const { publicKey, connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { usdc, sol, loading, error, updatedAt, refresh } = useWalletBalances()
  const [copied, setCopied] = useState(false)
  const address = publicKey?.toBase58() || ''

  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Wallet address copied')
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (!connected || !publicKey) {
    return <div className="max-w-4xl mx-auto"><SEO title="Dashboard" /><Card className="p-10 lg:p-16 text-center"><div className="w-20 h-20 mx-auto mb-5 bg-royal-100 rounded-full flex items-center justify-center"><Wallet size={38} className="text-royal-600" /></div><div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 mb-4"><ShieldCheck size={13} /> Solana mainnet</div><h1 className="text-3xl lg:text-4xl font-bold text-ink-950 mb-3">Connect your personal wallet</h1><p className="text-ink-600 max-w-xl mx-auto mb-7">StashPot reads real native USDC and SOL from Solana. Financial product balances remain unavailable until their reviewed programs exist on mainnet.</p><Button size="lg" onClick={() => setVisible(true)}>Connect Phantom or Solflare</Button></Card></div>
  }

  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="Mainnet Dashboard" />
    <div className="flex items-start justify-between gap-4 flex-wrap"><div><p className="text-accent-700 text-sm font-mono mb-2">Solana mainnet · live wallet data</p><h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Your StashPot</h1><button onClick={copyAddress} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-ink-100 px-3 py-2 text-sm font-mono text-ink-700 hover:bg-ink-200">{shortAddress(address, 6)} {copied ? <Check size={14} className="text-accent-600" /> : <Copy size={14} />}</button></div><div className="flex gap-2"><Button variant="secondary" loading={loading} onClick={refresh} leftIcon={<RefreshCw size={15} />}>Refresh</Button><Link to="/fund"><Button>Fund wallet</Button></Link></div></div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    <div className="grid sm:grid-cols-3 gap-4"><StatCard label="Wallet USDC" value={formatUSDC(usdc)} icon={<Wallet size={18} />} subtext="Spendable in connected wallet" /><StatCard label="SOL for fees" value={`${sol.toFixed(4)} SOL`} icon={<Wallet size={18} />} subtext="Mainnet network fees" /><StatCard label="StashScore" value="Unavailable" icon={<Sparkles size={18} />} subtext="Needs verified program activity" /></div>
    <div><div className="flex justify-between items-end mb-4"><div><h2 className="text-2xl font-bold">Financial overview</h2><p className="text-sm text-ink-500 mt-1">Unavailable values are never replaced with zero or browser estimates.</p></div>{updatedAt && <p className="text-xs text-ink-500">Wallet refreshed {updatedAt.toLocaleTimeString()}</p>}</div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"><UnavailableValue label="Flexible Savings" /><UnavailableValue label="Locked Savings" /><UnavailableValue label="Prize Principal / Rewards" /><UnavailableValue label="Circle Contributions" /><UnavailableValue label="Outstanding Loans" /><UnavailableValue label="Loan Eligibility" /><UnavailableValue label="Total Saved" /><UnavailableValue label="Available Savings" /></div></div>
    <div><h2 className="text-2xl font-bold mb-4">Products</h2><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{PRODUCTS.map(({ to, label, description, icon: Icon }) => <Link to={to} key={to}><Card className="p-5 hover-lift h-full"><Icon className="text-royal-600" size={20} /><h3 className="font-bold mt-3">{label}</h3><p className="text-sm text-ink-500 mt-1">{description}</p></Card></Link>)}</div></div>
    <div className="grid lg:grid-cols-2 gap-6"><Card className="p-6"><h2 className="text-xl font-bold mb-3">Recent product activity</h2><p className="text-sm text-ink-600">No StashPot program events exist on mainnet yet. Wallet-level signatures are available on the Activity page.</p><Link to="/activity" className="inline-flex items-center gap-1 text-sm font-semibold text-royal-700 mt-4">Open Activity <ExternalLink size={13} /></Link></Card><Card className="p-6"><h2 className="text-xl font-bold mb-3">Asset verification</h2><p className="text-sm text-ink-600 mb-2">Only Circle-issued native USDC is counted.</p><code className="block rounded-lg bg-ink-50 border border-ink-200 p-3 text-xs break-all">{USDC_MAINNET_MINT_ADDRESS}</code><a href={solscanAccountUrl(address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-royal-700 mt-4">View wallet on Solscan <ExternalLink size={13} /></a></Card></div>
    <Card className="p-6 border-amber-200 bg-amber-50"><h2 className="font-bold text-amber-950 mb-2">Production safety boundary</h2><p className="text-sm text-amber-900">The wallet and Jupiter funding layer are live on mainnet. Savings, locks, prize yield, circles and loans are restored as product areas but cannot accept funds until their programs are implemented, adversarially tested, independently reviewed, deployed by you, and verified in this app.</p></Card>
  </div>
}
