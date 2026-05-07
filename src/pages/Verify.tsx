import { FC, useState } from 'react'
import { ShieldCheck, Search, Hash } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, getErrorMessage, shortAddress } from '../lib/utils'
import toast from 'react-hot-toast'

const Verify: FC = () => {
  const [tab, setTab] = useState<'round'|'weights'|'odds'>('round')
  const [roundId, setRoundId] = useState('')
  const [poolType, setPoolType] = useState('weekly')
  const [wallet, setWallet] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    setLoading(true); setResult(null)
    try {
      let data
      if (tab === 'round') { if (!roundId) throw new Error('Round ID required'); data = await api.verifyRound(roundId, poolType) }
      else if (tab === 'weights') data = await api.getWeights(poolType)
      else { if (!wallet) throw new Error('Wallet required'); data = await api.getOdds(wallet) }
      setResult(data)
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Verify" />

      <div>
        <p className="text-ink-500 text-sm font-mono mb-2">Public verifiability</p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Verify</h1>
        <p className="text-ink-600 mt-3 max-w-2xl">Reproduce any winner from on-chain state. Switchboard VRF + Merkle root. No trust required.</p>
      </div>

      <Card className="p-6 bg-gradient-to-br from-white to-accent-50 border-accent-200">
        <div className="flex items-start gap-3">
          <ShieldCheck size={24} className="text-accent-600 flex-shrink-0" />
          <div>
            <h3 className="font-bold mb-2 text-ink-950">How verification works</h3>
            <p className="text-ink-600 text-sm leading-relaxed">
              Every draw commits a Merkle root of all weighted balances. The VRF result combined with this root determines the winner deterministically. Anyone can recompute the same result from public data.
            </p>
          </div>
        </div>
      </Card>

      <div className="flex gap-2 border-b border-ink-200 overflow-x-auto">
        {[
          { k: 'round', l: 'Verify Round' },
          { k: 'weights', l: 'Current Weights' },
          { k: 'odds', l: 'Wallet Odds' },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => { setTab(k as any); setResult(null) }}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 whitespace-nowrap ${
              tab === k ? 'border-accent-500 text-accent-700' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}>{l}</button>
        ))}
      </div>

      <Card className="p-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {tab === 'round' && (
            <>
              <Input placeholder="Round ID" value={roundId} onChange={(e) => setRoundId(e.target.value)} leftIcon={<Hash size={16} />} className="flex-1" />
              <select value={poolType} onChange={(e) => setPoolType(e.target.value)}
                className="bg-white border border-ink-200 rounded-xl px-4 py-3 text-ink-900 focus:outline-none focus:border-accent-500">
                <option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option>
              </select>
            </>
          )}
          {tab === 'weights' && (
            <select value={poolType} onChange={(e) => setPoolType(e.target.value)}
              className="bg-white border border-ink-200 rounded-xl px-4 py-3 text-ink-900 focus:outline-none focus:border-accent-500 flex-1">
              <option value="daily">Daily Pool</option><option value="weekly">Weekly Pool</option><option value="monthly">Monthly Pool</option>
            </select>
          )}
          {tab === 'odds' && <Input placeholder="Wallet address" value={wallet} onChange={(e) => setWallet(e.target.value)} className="flex-1" />}
          <Button onClick={handleSearch} loading={loading} leftIcon={<Search size={16} />}>Search</Button>
        </div>
      </Card>

      {result && (
        <Card className="p-6">
          <h3 className="text-xl font-bold mb-4 text-ink-950 tracking-tight">Result</h3>

          {tab === 'round' && result.round_index && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Round</p><p className="font-mono font-bold text-ink-900">#{result.round_index}</p></div>
                <div><p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Prize</p><p className="font-mono font-bold text-accent-600">{formatUSDC(result.prize_amount)}</p></div>
                <div><p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Players</p><p className="font-mono font-bold text-ink-900">{result.participant_count}</p></div>
                <div><p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Total Weight</p><p className="font-mono font-bold text-ink-900">{result.total_weight?.toFixed(2)}</p></div>
              </div>

              <div className="bg-ink-50 p-4 rounded-xl">
                <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">Formula</p>
                <code className="text-xs font-mono text-accent-700 block break-all">{result.formula}</code>
              </div>

              {result.participants && result.participants.length > 0 && (
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wider mb-2">Participants</p>
                  <div className="space-y-1 max-h-96 overflow-y-auto">
                    {result.participants.map((p: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2 border-b border-ink-100 text-sm">
                        <span className="font-mono text-ink-900">{shortAddress(p.wallet)}</span>
                        <div className="flex gap-4 text-xs">
                          <span className="text-ink-500">{formatUSDC(p.avg_balance)}</span>
                          <span className="font-mono text-accent-600 w-20 text-right">{p.chance}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'weights' && result.weights && (
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {result.weights.map((w: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-ink-50">
                  <div>
                    <p className="font-mono text-sm text-ink-900">{shortAddress(w.wallet)}</p>
                    <p className="text-ink-500 text-xs">{formatUSDC(w.avg_balance)} · {w.held_hours}h</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-accent-600">{w.chance}</p>
                    <p className="text-ink-500 text-xs font-mono">W={w.weight.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'odds' && result.odds && (
            <div className="space-y-3">
              {Object.entries(result.odds).map(([pt, info]: any) => (
                <div key={pt} className="p-4 rounded-xl bg-ink-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold capitalize text-ink-900">{pt}</span>
                    {info.active ? <span className="text-accent-600 font-mono font-semibold">{info.chance}</span> : <span className="text-ink-500 text-sm">Not active</span>}
                  </div>
                  {info.active && (
                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div><p className="text-ink-500">Balance</p><p className="font-mono text-ink-900">{formatUSDC(info.balance)}</p></div>
                      <div><p className="text-ink-500">Held</p><p className="font-mono text-ink-900">{info.held_hours}h</p></div>
                      <div><p className="text-ink-500">Pool size</p><p className="font-mono text-ink-900">{info.pool_size}</p></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  )
}

export default Verify
