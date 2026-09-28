import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { Check, Copy, ExternalLink, RefreshCw, ShieldCheck, Target, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/Button'
import { Card, StatCard } from '../components/Card'
import { Input } from '../components/Input'
import { SEO } from '../components/SEO'
import { useWalletBalances } from '../hooks/useWalletBalances'
import { solscanAccountUrl, USDC_MAINNET_MINT_ADDRESS } from '../lib/solana'
import { formatUSDC, shortAddress } from '../lib/utils'

const GOAL_KEY = 'stashpot_personal_savings_goal_usdc'

const Dashboard: FC = () => {
  const { publicKey, connected } = useWallet()
  const { setVisible } = useWalletModal()
  const { usdc, sol, loading, error, refresh } = useWalletBalances()
  const [goal, setGoal] = useState(() => localStorage.getItem(GOAL_KEY) || '1000')
  const [copied, setCopied] = useState(false)

  const address = publicKey?.toBase58() || ''
  const goalNumber = Math.max(0, Number(goal) || 0)
  const progress = goalNumber > 0 ? Math.min(100, (usdc / goalNumber) * 100) : 0

  useEffect(() => {
    localStorage.setItem(GOAL_KEY, goal)
  }, [goal])

  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    toast.success('Wallet address copied')
    window.setTimeout(() => setCopied(false), 1800)
  }

  if (!connected || !publicKey) {
    return (
      <div className="max-w-4xl mx-auto">
        <SEO title="Dashboard" />
        <Card className="p-10 lg:p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-5 bg-royal-100 rounded-full flex items-center justify-center">
            <Wallet size={38} className="text-royal-600" />
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 mb-4">
            <ShieldCheck size={13} /> Solana mainnet
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-ink-950 mb-3">Connect your personal wallet</h1>
          <p className="text-ink-600 max-w-xl mx-auto mb-7">StashPot reads your real native USDC balance directly from Solana. There is no backend account, custodial balance, or simulated credit.</p>
          <Button size="lg" onClick={() => setVisible(true)}>Connect Phantom or Solflare</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Mainnet Dashboard" />

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-accent-700 text-sm font-mono mb-2">Solana mainnet · live on-chain data</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Your Stash</h1>
          <button onClick={copyAddress} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-ink-100 px-3 py-2 text-sm font-mono text-ink-700 hover:bg-ink-200">
            {shortAddress(address, 6)} {copied ? <Check size={14} className="text-accent-600" /> : <Copy size={14} />}
          </button>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" loading={loading} onClick={refresh} leftIcon={<RefreshCw size={15} />}>Refresh</Button>
          <Link to="/fund"><Button>Fund wallet</Button></Link>
        </div>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Native USDC" value={formatUSDC(usdc)} icon={<Wallet size={18} />} subtext="Available in your wallet" />
        <StatCard label="SOL for fees" value={`${sol.toFixed(4)} SOL`} icon={<Wallet size={18} />} subtext="Mainnet network fees" />
        <StatCard label="Network" value="Mainnet" icon={<ShieldCheck size={18} />} subtext="Real assets · real value" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <Card className="lg:col-span-3 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Target size={20} className="text-royal-600" />
            <h2 className="text-xl font-bold text-ink-950">Personal savings target</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-4 items-end">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-ink-600">{formatUSDC(usdc)} saved</span>
                <span className="font-semibold text-royal-700">{progress.toFixed(1)}%</span>
              </div>
              <div className="h-3 rounded-full bg-ink-100 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-royal-600 to-accent-500 transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
            <Input label="Target" type="number" min="0" value={goal} onChange={(event) => setGoal(event.target.value)} rightAddon="USDC" />
          </div>
          <p className="text-xs text-ink-500 mt-4">Your target is stored only in this browser. Your wallet and USDC remain on Solana.</p>
        </Card>

        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold text-ink-950 mb-4">Asset verification</h2>
          <p className="text-sm text-ink-600 mb-2">Only Circle-issued native USDC is counted.</p>
          <code className="block rounded-lg bg-ink-50 border border-ink-200 p-3 text-xs break-all text-ink-800">{USDC_MAINNET_MINT_ADDRESS}</code>
          <a href={solscanAccountUrl(address)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-royal-700 hover:text-royal-800">
            View wallet on Solscan <ExternalLink size={14} />
          </a>
        </Card>
      </div>

      <Card className="p-6 border-amber-200 bg-amber-50">
        <h2 className="font-bold text-amber-950 mb-2">Production safety boundary</h2>
        <p className="text-sm text-amber-900">Prize pools, loans, circles, and inheritance vaults are not enabled because no verified StashPot mainnet programs were found. This build will not ask you to send real funds into an unverified contract.</p>
      </Card>
    </div>
  )
}

export default Dashboard
