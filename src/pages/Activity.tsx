import { ExternalLink, History, RefreshCw } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { SEO } from '../components/SEO'
import { useWalletActivity } from '../hooks/useWalletActivity'
import { solscanTransactionUrl } from '../lib/solana'
import { shortAddress } from '../lib/utils'

export default function Activity() {
  const { connected } = useWallet()
  const { items, loading, error, refresh } = useWalletActivity()
  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="Activity" />
    <div className="flex justify-between gap-4 flex-wrap">
      <ProductHeader icon={History} eyebrow="Mainnet transaction history" title="Activity" description="Current wallet signatures are read from Solana. Product-specific event names and amounts will be decoded from verified StashPot program events after those programs are deployed." />
      <Button variant="secondary" loading={loading} onClick={refresh} leftIcon={<RefreshCw size={15} />}>Refresh</Button>
    </div>
    {error && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
    {!connected ? <Card className="p-10 text-center text-ink-600">Connect a wallet to load its mainnet history.</Card> : items.length === 0 && !loading ? <Card className="p-10 text-center text-ink-600">No recent signatures were returned for this wallet.</Card> : (
      <Card className="overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-sm"><thead className="bg-ink-50 text-ink-500"><tr><th className="text-left p-4">Type</th><th className="text-left p-4">Time</th><th className="text-left p-4">Status</th><th className="text-left p-4">Slot</th><th className="text-left p-4">Signature</th></tr></thead><tbody className="divide-y divide-ink-100">{items.map((item) => <tr key={item.signature}><td className="p-4 font-medium">Wallet transaction</td><td className="p-4 text-ink-600">{item.timestamp ? new Date(item.timestamp * 1000).toLocaleString() : 'Timestamp unavailable'}</td><td className="p-4"><span className={item.status === 'confirmed' ? 'text-accent-700' : 'text-red-600'}>{item.status}</span></td><td className="p-4 font-mono">{item.slot.toLocaleString()}</td><td className="p-4"><a className="inline-flex items-center gap-1 text-royal-700 font-mono" href={solscanTransactionUrl(item.signature)} target="_blank" rel="noreferrer">{shortAddress(item.signature, 8)} <ExternalLink size={13} /></a></td></tr>)}</tbody></table></div>
      </Card>
    )}
    <p className="text-xs text-ink-500">No browser storage is used as a financial activity source. Until StashPot program event decoders exist, transactions remain conservatively unclassified.</p>
  </div>
}

