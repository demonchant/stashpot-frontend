import { FC, useEffect, useState } from 'react'
import { Gift, Copy, Trophy, Check } from 'lucide-react'
import { Card, StatCard } from '../components/Card'
import { Button } from '../components/Button'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, getErrorMessage, shortAddress } from '../lib/utils'
import toast from 'react-hot-toast'

const Referrals: FC = () => {
  const [stats, setStats] = useState<any>(null)
  const [leaderboard, setLeaderboard] = useState<any[]>([])
  const [copied, setCopied] = useState(false)

  const fetchData = async () => {
    try {
      const [s, l] = await Promise.all([api.getReferralStats(), api.getReferralLeaderboard()])
      setStats(s); setLeaderboard(l)
    } catch {}
  }
  useEffect(() => { fetchData() }, [])

  const handleCopy = () => {
    if (!stats?.code) return
    const url = `${window.location.origin}?ref=${stats.code}`
    navigator.clipboard.writeText(url)
    setCopied(true); toast.success('Copied')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Referrals" />

      <div>
        <p className="text-ink-500 text-sm font-mono mb-2">Earn 2 USDC per converted referral</p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Referrals</h1>
        <p className="text-ink-600 mt-3 max-w-2xl">Invite friends. Earn $2 USDC per converted referral.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Invites" value={stats?.total ?? 0} icon={<Gift size={18} />} />
        <StatCard label="Converted" value={stats?.deposited ?? 0} icon={<Trophy size={18} />}
          trend="up" trendValue={`${stats?.total > 0 ? Math.round((stats.deposited / stats.total) * 100) : 0}%`} />
        <StatCard label="Rewards Paid" value={stats?.paid ?? 0} subtext="referrals" />
        <StatCard label="Total Earned" value={formatUSDC(stats?.earned || 0)} icon={<Gift size={18} />} />
      </div>

      <Card className="p-8 bg-gradient-to-br from-accent-50 via-white to-accent-50 border-accent-200">
        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1 text-ink-950 tracking-tight">Your Referral Link</h2>
            <p className="text-ink-600">Share this link to earn rewards</p>
          </div>
          <Gift size={32} className="text-accent-600" />
        </div>

        {stats?.code ? (
          <div className="space-y-3">
            <div className="bg-white border border-ink-200 rounded-xl p-4 font-mono text-sm break-all text-ink-900">
              {window.location.origin}?ref={stats.code}
            </div>
            <Button className="w-full" size="lg" leftIcon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy Referral Link'}
            </Button>
            <p className="text-ink-500 text-xs text-center">Code: <span className="font-mono text-accent-700 font-semibold">{stats.code}</span></p>
          </div>
        ) : (
          <Button className="w-full" size="lg" onClick={async () => { try { const r = await api.generateReferralCode(); setStats({ ...stats, code: r.code }); toast.success('Generated') } catch (e) { toast.error(getErrorMessage(e)) }}}>
            Generate Referral Code
          </Button>
        )}
      </Card>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-ink-950 tracking-tight">Top Referrers</h2>
        {leaderboard.length === 0 ? (
          <Card className="p-12 text-center"><Trophy size={32} className="text-ink-300 mx-auto mb-3" /><p className="text-ink-500">Be the first!</p></Card>
        ) : (
          <Card className="divide-y divide-ink-100">
            {leaderboard.map((entry, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                    i === 0 ? 'bg-amber-100 text-amber-700' :
                    i === 1 ? 'bg-ink-200 text-ink-700' :
                    i === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-ink-100 text-ink-500'
                  }`}>{i + 1}</div>
                  <div>
                    <p className="font-medium text-ink-900">{entry.username || shortAddress(entry.wallet)}</p>
                    <p className="text-ink-500 text-xs font-mono">{shortAddress(entry.wallet)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-accent-600">{entry.conversions}</p>
                  <p className="text-ink-500 text-xs">conversions</p>
                </div>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

export default Referrals
