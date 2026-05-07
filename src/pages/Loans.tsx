import { FC, useEffect, useState } from 'react'
import { HandCoins, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { Modal } from '../components/Modal'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, getErrorMessage } from '../lib/utils'
import toast from 'react-hot-toast'

const Loans: FC = () => {
  const [eligibility, setEligibility] = useState<any>(null)
  const [myLoans, setMyLoans] = useState<any[]>([])
  const [requestModal, setRequestModal] = useState<any>(null)
  const [repayModal, setRepayModal] = useState<any>(null)
  const [form, setForm] = useState({ amount: '', duration_days: '30' })
  const [repayAmount, setRepayAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    try {
      const [e, l] = await Promise.all([api.getEligibleLoans(), api.getMyLoans()])
      setEligibility(e); setMyLoans(l)
    } catch {}
  }
  useEffect(() => { fetchData() }, [])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Microloans" />

      <div>
        <p className="text-ink-500 text-sm font-mono mb-2">Borrow against your StashScore</p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Microloans</h1>
        <p className="text-ink-600 mt-3 max-w-2xl">Four loan tiers — from over-collateralized to score-only.</p>
      </div>

      {eligibility && (
        <Card className="p-6 bg-gradient-to-br from-white to-accent-50 border-accent-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">StashScore</p>
              <p className="text-5xl font-bold gradient-text-accent tabular tracking-tighter-2">{eligibility.score}</p>
            </div>
            <div className="text-right">
              <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">Active Loans</p>
              <p className="text-2xl font-bold text-ink-900">{eligibility.active_loans} <span className="text-ink-400 text-base">/ 3</span></p>
            </div>
            {eligibility.in_default && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle size={16} />
                <span className="text-sm font-medium">90-day default cooldown</span>
              </div>
            )}
          </div>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4 text-ink-950 tracking-tight">Available Loans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {eligibility?.eligible.map((loan: any) => (
            <Card key={loan.type} className="p-6" hover>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-2xl text-ink-900">Type {loan.type}</span>
                {loan.can_borrow ? <CheckCircle size={20} className="text-accent-600" /> : <XCircle size={20} className="text-ink-300" />}
              </div>
              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between"><span className="text-ink-500">Max</span><span className="font-mono text-ink-900">{formatUSDC(loan.max_amount, false)}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">APR</span><span className="font-mono text-ink-900">{loan.apr_pct}%</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Collateral</span><span className="font-mono text-ink-900">{loan.collateral_pct}%</span></div>
              </div>
              <Button className="w-full" size="sm" disabled={!loan.can_borrow} onClick={() => setRequestModal(loan)}>
                {loan.can_borrow ? 'Request Loan' : 'Locked'}
              </Button>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-ink-950 tracking-tight">My Loans</h2>
        {myLoans.length === 0 ? (
          <Card className="p-12 text-center">
            <HandCoins size={32} className="text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No loans yet.</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {myLoans.map(loan => {
              const elapsed = (Date.now() - new Date(loan.issued_at).getTime()) / 86_400_000
              const interest = (parseFloat(loan.principal) * parseFloat(loan.apr_bps) * elapsed) / (365 * 10_000)
              const total = parseFloat(loan.principal) + interest
              const remaining = total - parseFloat(loan.total_repaid)
              return (
                <Card key={loan.id} className="p-5">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-ink-900">Type {loan.loan_type}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          loan.status === 'active' ? 'bg-accent-50 text-accent-700' :
                          loan.status === 'repaid' ? 'bg-ink-100 text-ink-500' :
                          'bg-red-50 text-red-600'
                        }`}>{loan.status}</span>
                      </div>
                      <p className="text-ink-500 text-xs font-mono">Issued {new Date(loan.issued_at).toLocaleDateString()}</p>
                    </div>
                    <div className="grid grid-cols-3 gap-6 text-sm">
                      <div><p className="text-ink-500 text-xs">Principal</p><p className="font-mono text-ink-900">{formatUSDC(loan.principal)}</p></div>
                      <div><p className="text-ink-500 text-xs">Repaid</p><p className="font-mono text-ink-900">{formatUSDC(loan.total_repaid)}</p></div>
                      <div><p className="text-ink-500 text-xs">Remaining</p><p className="font-mono text-amber-600">{formatUSDC(Math.max(0, remaining))}</p></div>
                    </div>
                    {loan.status === 'active' && <Button size="sm" onClick={() => setRepayModal(loan)}>Repay</Button>}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Modal isOpen={!!requestModal} onClose={() => setRequestModal(null)} title={requestModal ? `Request Type ${requestModal.type} Loan` : ''}>
        {requestModal && (
          <div className="space-y-4">
            <div className="bg-ink-50 rounded-xl p-4 text-sm space-y-1">
              <div className="flex justify-between"><span className="text-ink-500">Max</span><span className="font-mono text-ink-900">{formatUSDC(requestModal.max_amount, false)}</span></div>
              <div className="flex justify-between"><span className="text-ink-500">APR</span><span className="font-mono text-ink-900">{requestModal.apr_pct}%</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Collateral</span><span className="font-mono text-ink-900">{requestModal.collateral_pct}%</span></div>
            </div>
            <Input label="Amount" type="number" value={form.amount} onChange={(e) => setForm({...form, amount: e.target.value})} rightAddon="USDC" placeholder="0.00" />
            <Input label="Duration (days)" type="number" value={form.duration_days} onChange={(e) => setForm({...form, duration_days: e.target.value})} />
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => setRequestModal(null)}>Cancel</Button>
              <Button className="flex-1" loading={loading} onClick={async () => {
                setLoading(true)
                try {
                  await api.requestLoan({ loan_type: requestModal.type, amount: parseFloat(form.amount), duration_days: parseInt(form.duration_days) })
                  toast.success('Loan issued')
                  setRequestModal(null); setForm({ amount: '', duration_days: '30' }); fetchData()
                } catch (e) { toast.error(getErrorMessage(e)) }
                finally { setLoading(false) }
              }}>Confirm</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!repayModal} onClose={() => { setRepayModal(null); setRepayAmount('') }} title="Repay Loan">
        {repayModal && (
          <div className="space-y-4">
            <Input label="Repayment amount" type="number" value={repayAmount} onChange={(e) => setRepayAmount(e.target.value)} rightAddon="USDC" />
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => { setRepayModal(null); setRepayAmount('') }}>Cancel</Button>
              <Button className="flex-1" loading={loading} onClick={async () => {
                if (!repayAmount) return
                setLoading(true)
                try {
                  await api.repayLoan(repayModal.id, parseFloat(repayAmount))
                  toast.success('Repaid')
                  setRepayModal(null); setRepayAmount(''); fetchData()
                } catch (e) { toast.error(getErrorMessage(e)) }
                finally { setLoading(false) }
              }}>Repay</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Loans
