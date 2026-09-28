import { ArrowUpFromLine, LockKeyhole, ShieldCheck } from 'lucide-react'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function Withdrawals() {
  return <div className="max-w-6xl mx-auto space-y-8">
    <SEO title="Withdrawals" />
    <ProductHeader icon={ArrowUpFromLine} eyebrow="Owner-authorized exits" title="Withdrawals" description="Withdrawals are product-specific program instructions. StashPot never treats a database update as a payout and never asks for a seed phrase." />
    <ProgramGate feature="personalSavings" />
    <div className="grid md:grid-cols-2 gap-5">
      <Card className="p-6"><ShieldCheck className="text-royal-600" /><h2 className="font-bold mt-4">Flexible savings</h2><p className="text-sm text-ink-600 mt-2">Partial/full owner withdrawals become available only when the Personal Savings program and correct vault PDA are verified.</p></Card>
      <Card className="p-6"><LockKeyhole className="text-royal-600" /><h2 className="font-bold mt-4">Restricted products</h2><p className="text-sm text-ink-600 mt-2">TimeLockr, prize draw cutoffs, circle liabilities, collateral and strategy liquidity each enforce separate exit conditions on-chain.</p></Card>
    </div>
  </div>
}

