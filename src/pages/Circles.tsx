import { CalendarClock, CircleDollarSign, Users } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function Circles() {
  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="Savings Circles" />
    <ProductHeader icon={Users} eyebrow="Ajo / ROSCA on-chain" title="Savings Circles" description="Create, join and contribute native USDC with fixed member order, cycle deadlines and one payout per recipient cycle. Solo/test circles remain honest waiting/test states—not fake multi-member ROSCAs." />
    <ProgramGate feature="circles" />
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="p-7"><Users className="text-royal-600" /><h2 className="font-bold text-xl mt-4">Solo / test circle</h2><p className="text-sm text-ink-600 mt-2">One real member can create, contribute, inspect the vault, and exercise pre-start close rules. Rotating payout stays unavailable until the circle has the required members.</p></Card>
      <Card className="p-7"><CircleDollarSign className="text-royal-600" /><h2 className="font-bold text-xl mt-4">Multi-user circle</h2><p className="text-sm text-ink-600 mt-2">Exact contributions, member cap, deadlines, recipient order, missed-payment state, payout and completion are enforced by program accounts.</p></Card>
    </div>
    <Card className="p-6 flex items-start gap-3"><CalendarClock className="text-amber-700 shrink-0" /><p className="text-sm text-ink-700">Circle funds are isolated. They cannot fund loans, prize rewards, TimeLockr withdrawals or the StashPot treasury.</p></Card>
    <Button disabled>Create circle after reviewed deployment</Button>
  </div>
}

