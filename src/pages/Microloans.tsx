import { BadgeCheck, HandCoins, Landmark, Scale } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function Microloans() {
  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="Microloans and StashScore" />
    <ProductHeader icon={HandCoins} eyebrow="Activity-based eligibility" title="Microloans" description="Secured and carefully limited reputation loans use verified StashPot history, configurable policy and a completely separate Lending Treasury. StashScore is an explainable internal metric—not a credit-bureau score." />
    <ProgramGate feature="microloans" />
    <div className="grid md:grid-cols-4 gap-4">
      <Card className="p-5"><p className="text-xs uppercase tracking-wider text-ink-500">StashScore</p><p className="text-xl font-bold mt-2">Unavailable</p><p className="text-xs text-ink-500 mt-1">No verified activity index</p></Card>
      <Card className="p-5"><p className="text-xs uppercase tracking-wider text-ink-500">Eligibility</p><p className="text-xl font-bold mt-2">Not assessed</p></Card>
      <Card className="p-5"><p className="text-xs uppercase tracking-wider text-ink-500">Outstanding debt</p><p className="text-xl font-bold mt-2">Not deployed</p></Card>
      <Card className="p-5"><p className="text-xs uppercase tracking-wider text-ink-500">Treasury liquidity</p><p className="text-xl font-bold mt-2">Not funded</p></Card>
    </div>
    <div className="grid md:grid-cols-3 gap-5">
      <Card className="p-6"><BadgeCheck className="text-royal-600" /><h2 className="font-bold mt-4">Explainable score</h2><p className="text-sm text-ink-600 mt-2">Savings consistency, history, completed locks, circle reliability, repayments and account maturity are versioned and visible.</p></Card>
      <Card className="p-6"><Scale className="text-royal-600" /><h2 className="font-bold mt-4">Two loan modes</h2><p className="text-sm text-ink-600 mt-2">Secured loans use knowingly pledged eligible collateral. Reputation loans expose only capped, explicitly allocated treasury liquidity.</p></Card>
      <Card className="p-6"><Landmark className="text-royal-600" /><h2 className="font-bold mt-4">Isolated treasury</h2><p className="text-sm text-ink-600 mt-2">Savings, locks, prize principal/rewards and circle funds can never become lending liquidity implicitly.</p></Card>
    </div>
    <Button disabled>Borrow after policy, funding and deployment</Button>
  </div>
}

