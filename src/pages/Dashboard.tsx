import { FC, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wallet, Trophy, TrendingUp, Clock, ArrowUpRight, ArrowDownRight, Sparkles, Copy, Check,
} from 'lucide-react'
import { usePrivy } from '@privy-io/react-auth'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, timeAgo } from '../lib/utils'
import { useAuthStore } from '../store/auth'
import toast from 'react-hot-toast'

const Dashboard: FC = () => {
  const { user } = useAuthStore()
  const { user: privyUser } = usePrivy()
  const [pools, setPools] = useState<any[]>([])
  const [odds, setOdds] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Get Solana wallet address from Privy
  const solanaWallet = privyUser?.linkedAccounts?.find(
    (account: any) => account.type === 'wallet' && account.chainType === 'solana'
  )?.address

  useEffect(() => {
    Promise.all([
      api.getPools().catch(() => []),
      api.getMyOdds().catch(() => null),
      api.getHistory().catch(() => []),
    ]).then(([p, o, h]) => {
      setPools(p); setOdds(o); setHistory(h.slice(0, 5)); setLoading(false)
    })
  }, [])

  const totalDeposited = pools.reduce((s, p) => s + (parseFloat(p.balance) || 0), 0)

  const copyAddress = () => {
    if (solanaWallet) {
      navigator.clipboard.writeText(solanaWallet)
      setCopied(true)
      toast.success('Address copied!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shortAddress = (addr: string) => {
    if (!addr) return '—'
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Dashboard" />

      <div>
        <p className="text-ink-500 text-sm font-mono mb-2">
          Welcome back{user?.username ? `, ${user.username}` : ''}.
        </p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Your Stash</h1>
        
        {solanaWallet && (
          <div className="mt-4 flex items-center gap-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-ink-100 rounded-lg">
              <Wallet size={16} className="text-ink-600" />
              <span className="font-mono text-sm text-ink-900">{shortAddress(solanaWallet)}</span>
              <button
                onClick={copyAddress}
                className="p-1 hover:bg-ink-200 rounded transition-colors"
                title="Copy address"
              >
                {copied ? <Check size={14} className="text-accent-600" /> : <Copy size={14} className="text-ink-600" />}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="USDC Balance" value={formatUSDC(user?.usdc || '0')} icon={<Wallet size={18} />} subtext="Available" />
        <StatCard label="In Prize Pools" value={formatUSDC(totalDeposited)} icon={<Trophy size={18} />} trend="up" trendValue="earning" />
        <StatCard label="StashScore" value={user?.composite ?? 0} icon={<Sparkles size={18} />} subtext={user?.tier || 'Building...'} />
        <StatCard label="Blended APY" value="8.74%" icon={<TrendingUp size={18} />} subtext="4 protocols" trend="up" trendValue="+0.12%" />
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-ink-950 tracking-tight">Active Positions</h2>
          <Link to="/pools">
            <Button variant="ghost" size="sm" rightIcon={<ArrowUpRight size={14} />}>View All</Button>
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-ink-100 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['daily','weekly','monthly'].map(pt => {
              const pool = pools.find(p => p.type === pt)
              const myOdds = odds?.[pt]
              return (
                <Card key={pt} hover className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs uppercase tracking-widest text-ink-500 font-medium">{pt}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-accent-50 text-accent-700 font-medium">{pool?.prize_share || '—'}</span>
                  </div>
                  <p className="text-ink-500 text-xs mb-1">My win chance</p>
                  <p className="text-3xl font-bold text-ink-900 mb-4 tabular tracking-tighter-2">{myOdds?.chance || '0%'}</p>
                  <div className="space-y-2 text-xs text-ink-600">
                    <div className="flex justify-between"><span>Pool size</span><span className="font-mono text-ink-900">{pool?.participants ?? 0}</span></div>
                    <div className="flex justify-between"><span>Total pool</span><span className="font-mono text-ink-900">{formatUSDC(pool?.balance || 0)}</span></div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-ink-950 tracking-tight">Recent Activity</h2>
          <Clock size={18} className="text-ink-400" />
        </div>
        {history.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-ink-500 mb-4">No activity yet.</p>
            <Link to="/pools"><Button>Deposit USDC</Button></Link>
          </Card>
        ) : (
          <Card className="divide-y divide-ink-100">
            {history.map((tx, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    ['deposit','fiat_deposit','pool_win'].includes(tx.type)
                      ? 'bg-accent-50 text-accent-600' : 'bg-ink-100 text-ink-600'
                  }`}>
                    {['deposit','fiat_deposit','pool_win'].includes(tx.type) ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <p className="font-medium text-ink-900 capitalize">{tx.type.replace('_',' ')}</p>
                    <p className="text-ink-500 text-xs">{timeAgo(tx.created_at)}</p>
                  </div>
                </div>
                <p className={`font-mono font-semibold ${
                  ['deposit','fiat_deposit','pool_win'].includes(tx.type) ? 'text-accent-600' : 'text-ink-900'
                }`}>
                  {['deposit','fiat_deposit','pool_win'].includes(tx.type) ? '+' : '−'}{formatUSDC(tx.amount)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

export default Dashboard
