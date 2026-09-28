import { Gift, ShieldAlert } from 'lucide-react'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { SEO } from '../components/SEO'

export default function Referrals() {
  return <div className="max-w-5xl mx-auto space-y-8">
    <SEO title="Referrals" />
    <ProductHeader icon={Gift} eyebrow="Growth metadata" title="Referrals" description="Referral relationships and consent belong in the application backend. Any reward must have an explicit funded source and on-chain transfer—it cannot be created by crediting a database balance." />
    <Card className="p-7 border-amber-200 bg-amber-50 flex gap-3"><ShieldAlert className="text-amber-700 shrink-0" /><div><h2 className="font-bold text-amber-950">Not active</h2><p className="text-sm text-amber-900 mt-1">The suspended backend’s referral ledger was not financial truth. Referral creation remains off until secure wallet authentication, consent records, anti-abuse policy and a real reward budget are deployed.</p></div></Card>
  </div>
}

