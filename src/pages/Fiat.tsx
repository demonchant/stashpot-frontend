import { FC, useEffect, useState } from 'react'
import { Banknote, ArrowDown } from 'lucide-react'
import { Card } from '../components/Card'
import { Button } from '../components/Button'
import { Input } from '../components/Input'
import { SEO } from '../components/SEO'
import { api } from '../lib/api'
import { formatUSDC, getErrorMessage, timeAgo } from '../lib/utils'
import toast from 'react-hot-toast'

const CURRENCIES = [
  { code: 'NGN', label: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'GHS', label: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'KES', label: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'ZAR', label: 'South African Rand', flag: '🇿🇦' },
]

const Fiat: FC = () => {
  const [rates, setRates] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [currency, setCurrency] = useState('NGN')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [pendingRef, setPendingRef] = useState<string | null>(null)

  const fetchData = async () => {
    try {
      const [r, h] = await Promise.all([api.getFiatRates(), api.getFiatHistory()])
      setRates(r); setHistory(h)
    } catch {}
  }
  useEffect(() => { fetchData() }, [])

  const usdcAmount = rates && amount ? (parseFloat(amount) / rates.rates[currency]) * (1 - rates.fee_pct / 100) : 0

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO title="Fiat On-Ramp" />

      <div>
        <p className="text-ink-500 text-sm font-mono mb-2">Powered by Yellow Card</p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">On-Ramp</h1>
        <p className="text-ink-600 mt-3 max-w-2xl">Deposit local currency. Get USDC. No bridges, no swaps.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <h2 className="text-xl font-bold mb-4 text-ink-950 tracking-tight">Deposit Local Currency</h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={() => setCurrency(c.code)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  currency === c.code ? 'border-accent-500 bg-accent-50' : 'border-ink-200 bg-white hover:border-ink-300'
                }`}>
                <div className="text-2xl mb-1">{c.flag}</div>
                <div className="font-mono font-bold text-sm text-ink-900">{c.code}</div>
              </button>
            ))}
          </div>

          <Input label={`Amount in ${currency}`} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} rightAddon={currency} placeholder="0.00" />

          {rates && amount && (
            <div className="mt-4 p-4 rounded-xl bg-ink-50 border border-ink-200">
              <div className="flex items-center justify-center mb-3"><ArrowDown size={16} className="text-ink-400" /></div>
              <p className="text-ink-500 text-xs uppercase tracking-wider mb-1">You Receive</p>
              <p className="text-2xl font-bold text-accent-600 tabular tracking-tighter-2">{formatUSDC(usdcAmount)}</p>
              <div className="mt-3 pt-3 border-t border-ink-200 space-y-1 text-xs">
                <div className="flex justify-between"><span className="text-ink-500">Rate</span><span className="font-mono text-ink-900">1 USD = {rates.rates[currency]} {currency}</span></div>
                <div className="flex justify-between"><span className="text-ink-500">Fee</span><span className="font-mono text-ink-900">{rates.fee_pct}%</span></div>
              </div>
            </div>
          )}

          {pendingRef ? (
            <div className="mt-6 space-y-3">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                <p className="text-sm font-medium text-amber-700 mb-1">Pending Confirmation</p>
                <p className="text-xs font-mono text-ink-700">Reference: {pendingRef}</p>
              </div>
              <Button className="w-full" loading={loading} onClick={async () => {
                setLoading(true)
                try { const res = await api.mockConfirmFiat(pendingRef); toast.success(`Credited ${formatUSDC(res.usdc_credited)}`); setPendingRef(null); setAmount(''); fetchData() }
                catch (e) { toast.error(getErrorMessage(e)) }
                finally { setLoading(false) }
              }}>Mock Confirm Payment</Button>
            </div>
          ) : (
            <Button className="w-full mt-4" size="lg" loading={loading} disabled={!amount} leftIcon={<Banknote size={18} />} onClick={async () => {
              setLoading(true)
              try {
                const res = await api.initiateFiatDeposit({ currency, fiat_amount: parseFloat(amount), provider: 'yellow_card' })
                setPendingRef(res.reference); toast.success(`Initiated. Reference: ${res.reference}`); fetchData()
              } catch (e) { toast.error(getErrorMessage(e)) }
              finally { setLoading(false) }
            }}>Initiate Deposit</Button>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="font-bold mb-4 text-ink-950">Live Rates</h3>
          {rates && (
            <div className="space-y-3">
              {Object.entries(rates.rates).map(([code, rate]: any) => (
                <div key={code} className="flex justify-between items-center"><span className="font-mono text-sm text-ink-900">{code}</span><span className="font-mono text-sm text-ink-600">{rate}</span></div>
              ))}
              <div className="pt-3 border-t border-ink-200 text-xs text-ink-500">Updated {timeAgo(rates.updated_at)}</div>
            </div>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4 text-ink-950 tracking-tight">Deposit History</h2>
        {history.length === 0 ? (
          <Card className="p-12 text-center"><p className="text-ink-500">No deposits yet.</p></Card>
        ) : (
          <Card className="divide-y divide-ink-100">
            {history.map((tx, i) => (
              <div key={i} className="p-4 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-medium text-ink-900">{tx.fiat_currency} {tx.fiat_amount} → {formatUSDC(tx.usdc_amount)}</p>
                  <p className="text-ink-500 text-xs">{tx.provider} · {timeAgo(tx.created_at)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  tx.status === 'completed' ? 'bg-accent-50 text-accent-700' :
                  tx.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-600'
                }`}>{tx.status}</span>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  )
}

export default Fiat
