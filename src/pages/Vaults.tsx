import { FC, useEffect, useState } from 'react'
import { Lock, Plus, Heart, Trash2, Clock, Shield } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { getErrorMessage, shortAddress, timeAgo } from '../lib/utils'
import toast from 'react-hot-toast'

interface Beneficiary { wallet: string; pct: number }

const Vaults: FC = () => {
  const [vaults, setVaults] = useState<any[]>([])
  const [createOpen, setCreateOpen] = useState(false)
  const [inactivityDays, setInactivityDays] = useState('180')
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([{ wallet: '', pct: 100 }])
  const [loading, setLoading] = useState(false)

  const fetchVaults = async () => {
    try { setVaults(await api.getVaults()) } catch {}
  }
  useEffect(() => { fetchVaults() }, [])

  const handleCreate = async () => {
    const total = beneficiaries.reduce((s, b) => s + b.pct, 0)
    if (total !== 100) { toast.error(`Percentages must sum to 100 (currently ${total})`); return }
    if (beneficiaries.some(b => !b.wallet)) { toast.error('All beneficiaries need a wallet'); return }
    setLoading(true)
    try {
      await api.createVault({ inactivity_days: parseInt(inactivityDays), beneficiaries })
      toast.success('Vault created')
      setCreateOpen(false); setBeneficiaries([{ wallet: '', pct: 100 }]); setInactivityDays('180')
      fetchVaults()
    } catch (err) { toast.error(getErrorMessage(err)) }
    finally { setLoading(false) }
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="TimeLockr Vaults" />

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <p className="text-ink-500 text-sm font-mono mb-2">Inheritance vaults</p>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">TimeLockr</h1>
          <p className="text-ink-600 mt-3 max-w-2xl">
            Dead-man's switch on your assets. If you don't check in for X days, beneficiaries can claim. Reset the timer anytime.
          </p>
        </div>
        <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>New Vault</Button>
      </div>

      {vaults.length === 0 ? (
        <Card className="p-16 text-center">
          <Lock size={40} className="text-ink-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2 text-ink-950">No vaults yet</h3>
          <p className="text-ink-500 mb-6 max-w-md mx-auto">Create your first inheritance vault.</p>
          <Button leftIcon={<Plus size={16} />} onClick={() => setCreateOpen(true)}>Create First Vault</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {vaults.map(v => (
            <Card key={v.id} className="p-6" hover>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-accent-50 flex items-center justify-center">
                    <Shield size={20} className="text-accent-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-ink-900">Vault</h3>
                    <p className="text-ink-500 text-xs font-mono">{shortAddress(v.id, 6)}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  v.status === 'active' ? 'bg-accent-50 text-accent-700' : 'bg-ink-100 text-ink-500'
                }`}>{v.status}</span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm"><span className="text-ink-500">Inactivity</span><span className="font-mono text-ink-900">{v.inactivity_days} days</span></div>
                <div className="flex justify-between text-sm"><span className="text-ink-500">Last check-in</span><span className="font-mono text-ink-900">{timeAgo(v.last_ping)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-ink-500">Beneficiaries</span><span className="font-mono text-ink-900">{v.beneficiaries?.length || 0}</span></div>
              </div>

              {v.status === 'active' && (
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1" leftIcon={<Heart size={14} />} onClick={async () => { try { await api.pingVault(v.id); toast.success('Checked in'); fetchVaults() } catch (e) { toast.error(getErrorMessage(e)) }}}>Check In</Button>
                  <Button variant="danger" size="sm" leftIcon={<Trash2 size={14} />} onClick={async () => { if (confirm('Cancel?')) { try { await api.cancelVault(v.id); toast.success('Cancelled'); fetchVaults() } catch (e) { toast.error(getErrorMessage(e)) }}}}>Cancel</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create Inheritance Vault" size="lg">
        <div className="space-y-4">
          <Input label="Inactivity Days" type="number" value={inactivityDays} onChange={(e) => setInactivityDays(e.target.value)} hint="Days without activity before beneficiaries can claim" leftIcon={<Clock size={16} />} />
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-ink-700 text-xs uppercase tracking-wider font-medium">Beneficiaries</label>
              <button onClick={() => setBeneficiaries([...beneficiaries, { wallet: '', pct: 0 }])} className="text-accent-600 text-xs font-medium hover:underline">+ Add</button>
            </div>
            <div className="space-y-2">
              {beneficiaries.map((b, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Wallet" value={b.wallet} onChange={(e) => { const u = [...beneficiaries]; u[i] = { ...u[i], wallet: e.target.value }; setBeneficiaries(u) }} className="flex-1" />
                  <Input type="number" placeholder="%" value={b.pct} onChange={(e) => { const u = [...beneficiaries]; u[i] = { ...u[i], pct: Number(e.target.value) }; setBeneficiaries(u) }} className="w-24" />
                  {beneficiaries.length > 1 && (
                    <button onClick={() => setBeneficiaries(beneficiaries.filter((_, idx) => idx !== i))} className="px-3 text-red-500 hover:bg-red-50 rounded-xl">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <p className="text-ink-500 text-xs">Total: {beneficiaries.reduce((s, b) => s + b.pct, 0)}% (must equal 100%)</p>
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreate} loading={loading}>Create Vault</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Vaults
