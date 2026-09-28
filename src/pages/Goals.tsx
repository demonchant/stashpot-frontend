import { Target } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function Goals() {
  return <div className="max-w-6xl mx-auto space-y-8">
    <SEO title="Savings Goals" />
    <ProductHeader icon={Target} eyebrow="Targets without double counting" title="Savings Goals" description="Goals organize Personal Savings pots. Wallet USDC is not treated as saved, borrowed funds are excluded, and moving funds between StashPot products must not inflate total-saved analytics." />
    <ProgramGate feature="personalSavings" />
    <Card className="p-7">
      <h2 className="font-bold text-xl">No on-chain savings goals yet</h2>
      <p className="text-sm text-ink-600 mt-2 max-w-2xl">The previous browser-only target has been removed from the financial dashboard because wallet funds are not the same as deposited savings. Goal creation will activate with the savings metadata service and verified pot accounts.</p>
      <Button className="mt-5" disabled>Create goal after deployment</Button>
    </Card>
  </div>
}

