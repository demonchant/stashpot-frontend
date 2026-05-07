import { FC, useEffect, useState } from 'react'
import { Users, Plus, UserPlus, Calendar, DollarSign } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, getErrorMessage, shortAddress } from '../lib/utils'
import toast from 'react-hot-toast'

const Circles: FC = () => {
  const [tab, setTab] = useState<'mine'|'public'>('mine')
  const [myCircles, setMyCircles] = useState<any[]>([])
  const [publicCircles, setPublicCircles] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [contributeModal, setContributeModal] = useState<any>(null)
  const [form, setForm] = useState({ name: '', max_members: '6', contribution: '100', cycle_days: '7' })
  const [contributeAmount, setContributeAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [m, p] = await Promise.all([api.getCircles(), api.getPublicCircles()])
      setMyCircles(m); setPublicCircles(p)
    } catch {}
  }
  useEffect(() => { fetchData() }, [])

  const handleCreate = async () => {
    setLoading(true)
    try {
      await api.createCircle({
        name: form.name || undefined,
        max_members: parseInt(form.max_members),
        contribution: parseFloat(form.contribution),
        cycle_days: parseInt(form.cycle_days),
      })
      toast.success('Circle created')
      setCreateOpen(false); setForm({ name: '', max_members: '6', contribution: '100', cycle_days: '7' })
      fetchData()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Savings Circles" />

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-ink-500 text-sm font-mono mb-2">Rotating savings · Ajo on-chain</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Savings Circles</h1>
          <p className="text-ink-600 mt-3 max-w-2xl">Join a circle. Contribute each cycle. Receive the full pot when it's your turn.</p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>New Circle</Button>
      </div>

      <div className="flex gap-2 border-b border-ink-200">
        {[
          { k: 'mine', l: `My Circles (${myCircles.length})` },
          { k: 'public', l: `Browse (${publicCircles.length})` },
        ].map(({ k, l }) => (
          <button key={k} onClick={() => setTab(k as any)}
            className={`px-4 py-3 font-medium text-sm transition-colors border-b-2 ${
              tab === k ? 'border-accent-500 text-accent-700' : 'border-transparent text-ink-500 hover:text-ink-700'
            }`}>{l}</button>
        ))}
      </div>

      {tab === 'mine' ? (
        myCircles.length === 0 ? (
          <Card className="p-16 text-center">
            <Users size={40} className="text-ink-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2 text-ink-950">You're not in any circles</h3>
            <p className="text-ink-500 mb-6">Create one or browse public circles.</p>
            <div className="flex gap-2 justify-center">
              <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create</Button>
              <Button variant="secondary" onClick={() => setTab('public')}>Browse</Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myCircles.map(c => <CircleCard key={c.id} circle={c} isMember onContribute={() => setContributeModal(c)} />)}
          </div>
        )
      ) : publicCircles.length === 0 ? (
        <Card className="p-16 text-center"><p className="text-ink-500">No public circles available.</p></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {publicCircles.map(c => <CircleCard key={c.id} circle={c} onJoin={async () => { try { await api.joinCircle(c.id); toast.success('Joined'); fetchData() } catch (e) { toast.error(getErrorMessage(e)) }}} />)}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Savings Circle">
        <div className="space-y-4">
          <Input label="Name (optional)" placeholder="My Savings Circle" value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Max Members" type="number" value={form.max_members} onChange={(e) => setForm({...form, max_members: e.target.value})} />
            <Input label="Cycle Days" type="number" value={form.cycle_days} onChange={(e) => setForm({...form, cycle_days: e.target.value})} />
          </div>
          <Input label="Contribution per Cycle" type="number" value={form.contribution} onChange={(e) => setForm({...form, contribution: e.target.value})} rightAddon="USDC" />
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate} loading={loading}>Create</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!contributeModal} onClose={() => { setContributeModal(null); setContributeAmount('') }} title="Make Contribution">
        {contributeModal && (
          <div className="space-y-4">
            <p className="text-ink-600">Required: <span className="font-mono text-accent-600 font-semibold">{formatUSDC(contributeModal.contribution)}</span></p>
            <Input label="Amount" type="number" value={contributeAmount} onChange={(e) => setContributeAmount(e.target.value)} rightAddon="USDC" placeholder={contributeModal.contribution} />
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setContributeModal(null); setContributeAmount('') }}>Cancel</Button>
              <Button className="flex-1" loading={loading} onClick={async () => { if (!contributeAmount) return; setLoading(true); try { await api.contributeCircle(contributeModal.id, parseFloat(contributeAmount)); toast.success('Contributed'); setContributeModal(null); setContributeAmount(''); fetchData() } catch (e) { toast.error(getErrorMessage(e)) } finally { setLoading(false) } }}>Contribute</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

const CircleCard: FC<{ circle: any; isMember?: boolean; onJoin?: () => void; onContribute?: () => void }> = ({ circle, isMember, onJoin, onContribute }) => (
  <Card className="p-6" hover>
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="font-bold text-lg text-ink-900">{circle.name || `Circle ${shortAddress(circle.id, 4)}`}</h3>
        <p className="text-ink-500 text-xs font-mono">{shortAddress(circle.id, 6)}</p>
      </div>
      <span className={`text-xs px-2 py-1 rounded-full font-medium ${circle.started ? 'bg-accent-50 text-accent-700' : 'bg-amber-50 text-amber-700'}`}>
        {circle.started ? 'Active' : 'Forming'}
      </span>
    </div>
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-2 text-sm"><DollarSign size={14} className="text-ink-400" /><span className="text-ink-500">Per cycle</span><span className="font-mono ml-auto text-ink-900">{formatUSDC(circle.contribution)}</span></div>
      <div className="flex items-center gap-2 text-sm"><Calendar size={14} className="text-ink-400" /><span className="text-ink-500">Cycle length</span><span className="font-mono ml-auto text-ink-900">{circle.cycle_days} days</span></div>
      <div className="flex items-center gap-2 text-sm"><Users size={14} className="text-ink-400" /><span className="text-ink-500">Members</span><span className="font-mono ml-auto text-ink-900">{circle.member_count}/{circle.max_members}</span></div>
    </div>
    {isMember && circle.started && onContribute && <Button className="w-full" onClick={onContribute}>Contribute</Button>}
    {!isMember && onJoin && <Button className="w-full" variant="secondary" leftIcon={<UserPlus size={14} />} onClick={onJoin}>Join Circle</Button>}
  </Card>
)

export default Circles
