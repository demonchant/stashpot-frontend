import type { LucideIcon } from 'lucide-react'

export function ProductHeader({ eyebrow, title, description, icon: Icon }: {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="w-12 h-12 rounded-2xl bg-royal-100 flex items-center justify-center shrink-0"><Icon className="text-royal-700" size={23} /></div>
      <div>
        <p className="text-sm font-mono text-royal-700 mb-1">{eyebrow}</p>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">{title}</h1>
        <p className="text-ink-600 mt-3 max-w-3xl leading-relaxed">{description}</p>
      </div>
    </div>
  )
}

