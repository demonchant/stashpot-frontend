import { Clock, LockKeyhole, ShieldAlert } from 'lucide-react'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { ProductHeader } from '../components/ProductHeader'
import { ProgramGate } from '../components/ProgramGate'
import { SEO } from '../components/SEO'

export default function TimeLockr() {
  return <div className="max-w-7xl mx-auto space-y-8">
    <SEO title="TimeLockr" />
    <ProductHeader icon={LockKeyhole} eyebrow="Program-enforced time locks" title="TimeLockr" description="Deposit native USDC for a chosen duration. The Solana program—not a hidden button—must reject withdrawals before unlock and return funds to the owner after the timestamp boundary." />
    <ProgramGate feature="timelock" />
    <div className="grid md:grid-cols-3 gap-5">
      <Card className="p-6"><Clock className="text-royal-600" /><h2 className="font-bold mt-4">Explicit state</h2><p className="text-sm text-ink-600 mt-2">Owner, mint, amount, created time, unlock time, vault, bump and withdrawal status are stored on-chain.</p></Card>
      <Card className="p-6"><LockKeyhole className="text-royal-600" /><h2 className="font-bold mt-4">No early withdrawal</h2><p className="text-sm text-ink-600 mt-2">The program validates the clock and PDA authority. UI visibility never determines access.</p></Card>
      <Card className="p-6"><ShieldAlert className="text-royal-600" /><h2 className="font-bold mt-4">No admin bypass</h2><p className="text-sm text-ink-600 mt-2">The initial design has no emergency principal-withdrawal authority. Any future recovery design must disclose its trust assumptions.</p></Card>
    </div>
    <Button disabled>Create lock after reviewed deployment</Button>
  </div>
}

