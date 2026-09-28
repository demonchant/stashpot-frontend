import { PiggyBank, Plus, Target, WalletCards } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function Savings() {
  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="Personal Savings Pots" />
    <ProductHeader icon={PiggyBank} eyebrow="Flexible on-chain savings" title="Savings Pots" description="Named native-USDC pots with explicit owner-controlled deposits, additions, targets, history, partial withdrawals and close rules. Funds will be held only by the reviewed Personal Savings program—not by a browser or database balance." />
    <ProgramGate feature="personalSavings" />
    <div className="grid md:grid-cols-3 gap-5">
      <Card className="p-6"><WalletCards className="text-royal-600" /><h2 className="font-bold text-lg mt-4">On-chain principal</h2><p className="text-sm text-ink-600 mt-2">Each pot uses its own PDA state and mint-validated token vault. The owner’s liability must match vault assets.</p></Card>
      <Card className="p-6"><Target className="text-royal-600" /><h2 className="font-bold text-lg mt-4">Goals are metadata</h2><p className="text-sm text-ink-600 mt-2">Names and targets may be indexed off-chain, but the deposited amount and withdrawals come from program state.</p></Card>
      <Card className="p-6"><PiggyBank className="text-royal-600" /><h2 className="font-bold text-lg mt-4">Flexible rules</h2><p className="text-sm text-ink-600 mt-2">Personal Savings is distinct from TimeLockr. Withdrawals remain owner-only and cannot consume other products’ vaults.</p></Card>
    </div>
    <Button disabled leftIcon={<Plus size={16} />}>Create savings pot after deployment</Button>
  </div>
}

