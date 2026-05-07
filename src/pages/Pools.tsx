import { FC, useEffect, useState } from 'react'
import { Trophy, Plus, Minus, Calendar, Users } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, getErrorMessage } from '../lib/utils'
import toast from 'react-hot-toast'

const Pools: FC = () => {
  const [pools, setPools] = useState<any[]>([])
  const [odds, setOdds] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [modal, setModal] = useState<{ type: 'deposit'|'withdraw', pool: string } | null>(null)
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [p, o, h] = await Promise.all([api.getPools(), api.getMyOdds(), api.getPoolHistory()])
      setPools(p); setOdds(o); setHistory(h)
    } catch {}
  }

  useEffect(() => { fetchData() }, [])

  const handleAction = async () => {
    if (!modal || !amount) return
    setLoading(true)
    try {
      const amt = parseFloat(amount)
      if (modal.type === 'deposit') await api.deposit(modal.pool, amt)
      else await api.withdraw(modal.pool, amt)
      toast.success(`${modal.type === 'deposit' ? 'Deposited' : 'Withdrew'} ${formatUSDC(amt)}`)
      setModal(null); setAmount(''); fetchData()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Prize Pools" />

      <div>
        <p className="text-ink-500 text-sm font-mono mb-2">No-loss prize draws</p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Prize Pools</h1>
        <p className="text-ink-600 mt-3 max-w-2xl">
          Deposit USDC. Yield aggregates across Kamino, Save, Marginfi & Drift. Winners chosen via Switchboard VRF every cycle. Principal always safe.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['daily','weekly','monthly'].map(pt => {
          const pool = pools.find(p => p.type === pt)
          const myOdds = odds?.[pt]
          return (
            <Card key={pt} className="p-8" hover>
              <div className="flex items-start justify-between mb-6">
                <div>
                  <Trophy size={28} className="text-accent-600" />
                  <h3 className="text-2xl font-bold mt-3 capitalize text-ink-950 tracking-tight">{pt}</h3>
                  <p className="text-ink-500 text-sm">
                    {pt === 'daily' ? 'Quick wins, every 24h' : pt === 'weekly' ? 'Bigger pot, every Monday' : 'Biggest prize, monthly'}
                  </p>
                </div>
                <span className="text-sm font-medium px-3 py-1 rounded-full bg-accent-50 text-accent-700">{pool?.prize_share || '—'}</span>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Total Pool</p>
                  <p className="text-3xl font-bold tabular tracking-tighter-2 text-ink-900">{formatUSDC(pool?.balance || 0)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">My Chance</p>
                    <p className="font-bold text-xl text-accent-600">{myOdds?.chance || '0%'}</p>
                  </div>
                  <div>
                    <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Players</p>
                    <p className="font-mono font-bold text-xl flex items-center gap-1 text-ink-900">
                      <Users size={14} className="text-ink-400" />{pool?.participants ?? 0}
                    </p>
                  </div>
                </div>
                {myOdds?.next_draw && (
                  <div>
                    <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Next Draw</p>
                    <p className="font-mono text-sm flex items-center gap-1 text-ink-700">
                      <Calendar size={14} className="text-ink-400" />{new Date(myOdds.next_draw).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button className="flex-1" leftIcon={<Plus size={14} />} onClick={() => setModal({ type: 'deposit', pool: pt })}>Deposit</Button>
                <Button variant="secondary" className="flex-1" leftIcon={<Minus size={14} />} onClick={() => setModal({ type: 'withdraw', pool: pt })}>Withdraw</Button>
              </div>
            </Card>
          )
        })}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-ink-950 tracking-tight">Your Wins</h2>
        {history.length === 0 ? (
          <Card className="p-12 text-center">
            <Trophy size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No wins yet. Keep stashing!</p>
          </Card>
        ) : (
          <Card className="divide-y divide-ink-100">
            {history.map((win, i) => (
              <div key={i} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium capitalize text-ink-900">{win.pool_type} pool win</p>
                  <p className="text-ink-500 text-xs font-mono">Round #{win.round_index}</p>
                </div>
                <p className="font-mono font-bold text-accent-600 text-lg">+{formatUSDC(win.amount)}</p>
              </div>
            ))}
          </Card>
        )}
      </div>

      <Modal isOpen={!!modal} onClose={() => { setModal(null); setAmount('') }} title={modal ? `${modal.type === 'deposit' ? 'Deposit to' : 'Withdraw from'} ${modal.pool} pool` : ''}>
        {modal && (
          <div className="space-y-4">
            <Input label="Amount" type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} rightAddon="USDC" autoFocus />
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setModal(null); setAmount('') }}>Cancel</Button>
              <Button className="flex-1" onClick={handleAction} loading={loading}>Confirm {modal.type}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Pools
