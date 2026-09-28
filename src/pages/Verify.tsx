import { useState } from 'react'
import { useConnection } from '@solana/wallet-adapter-react'
import { CheckCircle2, ExternalLink, Search, ShieldCheck, XCircle } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { Input } from '../components/Input'
import { ProductHeader } from '../components/ProductHeader'
import { SEO } from '../components/SEO'
import { programStatus, type ProgramFeature } from '../config/product'
import { solscanTransactionUrl } from '../lib/solana'

const FEATURES: ProgramFeature[] = ['personalSavings', 'timelock', 'prizeSavings', 'circles', 'microloans']

export default function Verify() {
  const { connection } = useConnection()
  const [signature, setSignature] = useState('')
  const [result, setResult] = useState<{ ok: boolean; slot?: number; status?: string; error?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const verify = async () => {
    if (!signature.trim()) return
    setLoading(true); setResult(null)
    try {
      const response = await connection.getSignatureStatus(signature.trim(), { searchTransactionHistory: true })
      if (!response.value) setResult({ ok: false, error: 'Signature was not found on Solana mainnet.' })
      else setResult({ ok: !response.value.err, slot: response.value.slot, status: response.value.confirmationStatus || 'processed', error: response.value.err ? JSON.stringify(response.value.err) : undefined })
    } catch (error) {
      setResult({ ok: false, error: error instanceof Error ? error.message : 'Verification failed' })
    } finally { setLoading(false) }
  }

  return <div className="max-w-6xl mx-auto space-y-8">
    <SEO title="Verify" />
    <ProductHeader icon={ShieldCheck} eyebrow="Independent mainnet checks" title="Verify" description="Check a Solana transaction signature and inspect whether each StashPot financial program has been explicitly configured and activated." />
    <Card className="p-6"><div className="flex flex-col md:flex-row gap-3 items-end"><Input className="flex-1" label="Transaction signature" value={signature} onChange={(event) => setSignature(event.target.value)} placeholder="Paste a Solana signature" /><Button loading={loading} onClick={verify} leftIcon={<Search size={15} />}>Verify on mainnet</Button></div>{result && <div className={`mt-5 rounded-xl p-4 text-sm ${result.ok ? 'bg-accent-50 text-accent-900' : 'bg-red-50 text-red-800'}`}><div className="flex items-center gap-2 font-bold">{result.ok ? <CheckCircle2 size={17} /> : <XCircle size={17} />}{result.ok ? 'Confirmed transaction' : 'Not verified'}</div>{result.slot && <p className="mt-1">Slot {result.slot.toLocaleString()} · {result.status}</p>}{result.error && <p className="mt-1 break-all">{result.error}</p>}<a href={solscanTransactionUrl(signature.trim())} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline mt-2">Open Solscan <ExternalLink size={13} /></a></div>}</Card>
    <Card className="overflow-hidden"><div className="p-5 border-b border-ink-100"><h2 className="font-bold text-lg">Financial program registry</h2></div><div className="divide-y divide-ink-100">{FEATURES.map((feature) => { const status = programStatus(feature); return <div key={feature} className="p-5 flex justify-between gap-4 items-center"><div><p className="font-semibold">{status.label}</p><p className="text-xs font-mono text-ink-500 mt-1 break-all">{status.programId || 'No mainnet program ID configured'}</p></div><span className={`text-xs font-bold rounded-full px-3 py-1 ${status.enabled ? 'bg-accent-50 text-accent-700' : 'bg-amber-50 text-amber-700'}`}>{status.enabled ? 'Enabled' : 'Unavailable'}</span></div> })}</div></Card>
  </div>
}

