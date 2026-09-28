import { Settings as SettingsIcon, ShieldCheck, Wallet } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { SEO } from '../components/SEO'
import { USDC_MAINNET_MINT_ADDRESS } from '../lib/solana'
import { shortAddress } from '../lib/utils'

export default function Settings() {
  const { publicKey, wallet } = useWallet()
  return <div className="max-w-5xl mx-auto space-y-8">
    <SEO title="Settings" />
    <ProductHeader icon={SettingsIcon} eyebrow="Network and safety configuration" title="Settings" description="Review the wallet, network and canonical asset used by StashPot. Private keys and seed phrases are never application settings." />
    <div className="grid md:grid-cols-2 gap-5">
      <Card className="p-6"><Wallet className="text-royal-600" /><h2 className="font-bold mt-4">Connected wallet</h2><p className="font-mono text-sm mt-2 break-all">{publicKey ? publicKey.toBase58() : 'Not connected'}</p><p className="text-xs text-ink-500 mt-2">Adapter: {wallet?.adapter.name || 'None'}</p></Card>
      <Card className="p-6"><ShieldCheck className="text-royal-600" /><h2 className="font-bold mt-4">Solana mainnet</h2><p className="text-sm text-ink-600 mt-2">Production cluster is fixed to mainnet. Smart-contract development remains local/devnet and test IDs are not accepted as production activation.</p></Card>
    </div>
    <Card className="p-6"><p className="text-xs uppercase tracking-wider text-ink-500">Native Circle USDC mint</p><code className="block mt-2 text-sm break-all">{USDC_MAINNET_MINT_ADDRESS}</code>{publicKey && <p className="text-xs text-ink-500 mt-3">Wallet: {shortAddress(publicKey.toBase58(), 8)}</p>}</Card>
  </div>
}

