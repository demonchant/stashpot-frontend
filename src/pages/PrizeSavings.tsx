import { BarChart3, Gift, ShieldCheck, Trophy } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function PrizeSavings() {
  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="Prize Savings" />
    <ProductHeader icon={Trophy} eyebrow="Yield-backed · principal excluded from prizes" title="Prize Savings" description="Principal liabilities, strategy assets, realized reward, winner allocation and treasury allocation are isolated. Only verified realized yield may be split 85% to the winner and 15% to the StashPot treasury." />
    <ProgramGate feature="prizeSavings" />
    <div className="grid md:grid-cols-4 gap-4">
      {[
        ['Your principal', 'Not deployed'],
        ['Redeemable value', 'Not deployed'],
        ['Realized reward', 'Not deployed'],
        ['Rewards won', 'Not deployed'],
      ].map(([label, value]) => <Card key={label} className="p-5"><p className="text-xs uppercase tracking-wider text-ink-500">{label}</p><p className="font-bold text-lg mt-2 text-ink-700">{value}</p></Card>)}
    </div>
    <div className="grid md:grid-cols-3 gap-5">
      <Card className="p-6"><ShieldCheck className="text-royal-600" /><h2 className="font-bold mt-4">Solvency first</h2><p className="text-sm text-ink-600 mt-2">Reward distribution must fail unless idle USDC plus redeemable strategy assets cover all principal liabilities.</p></Card>
      <Card className="p-6"><BarChart3 className="text-royal-600" /><h2 className="font-bold mt-4">Allowlisted strategies</h2><p className="text-sm text-ink-600 mt-2">Kamino, Drift and Project 0 adapters require current program/market verification. No arbitrary frontend destination is accepted.</p></Card>
      <Card className="p-6"><Gift className="text-royal-600" /><h2 className="font-bold mt-4">Honest solo mode</h2><p className="text-sm text-ink-600 mt-2">One eligible participant is valid and necessarily wins. No fake members or fake yield are added.</p></Card>
    </div>
    <Button disabled>Deposit after strategy and program review</Button>
  </div>
}

