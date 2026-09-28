import { AlertTriangle, CheckCircle2, Code2, ExternalLink, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card } from './Card'
import { programStatus, type ProgramFeature } from '../config/product'

export function ProgramGate({ feature, children }: { feature: ProgramFeature; children?: React.ReactNode }) {
  const status = programStatus(feature)
  if (status.enabled) return <>{children}</>

  return (
    <Card className="p-6 border-amber-200 bg-amber-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="text-amber-700 mt-0.5 shrink-0" size={20} />
        <div>
          <h2 className="font-bold text-amber-950">Mainnet actions are intentionally unavailable</h2>
          <p className="text-sm text-amber-900 mt-1">{status.reason} This page exposes the recovered product design without pretending that deposits, locks, payouts, or loans are live.</p>
          <div className="flex flex-wrap gap-3 mt-4 text-xs font-semibold text-amber-900">
            <span className="inline-flex items-center gap-1"><Code2 size={13} /> Local/devnet build required</span>
            <span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> Independent review required</span>
            <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} /> Owner-controlled mainnet deployment</span>
          </div>
          <Link to="/verify" className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-amber-950 underline">Verification center <ExternalLink size={13} /></Link>
        </div>
      </div>
    </Card>
  )
}

export function UnavailableValue({ label }: { label: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs uppercase tracking-wider text-ink-500">{label}</p>
      <p className="text-xl font-bold text-ink-700 mt-2">Not deployed</p>
      <p className="text-xs text-ink-500 mt-1">No mainnet program state to read</p>
    </Card>
  )
}

