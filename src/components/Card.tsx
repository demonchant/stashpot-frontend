import { FC, ReactNode } from 'react'
import { cn } from '../lib/utils'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export const Card: FC<CardProps> = ({ children, className, hover = false }) => (
  <div
    className={cn(
      'bg-white border border-ink-200 rounded-2xl shadow-soft',
      hover && 'hover-lift',
      className
    )}
  >
    {children}
  </div>
)

interface StatCardProps {
  label: string
  value: string | number
  subtext?: string
  icon?: ReactNode
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}

export const StatCard: FC<StatCardProps> = ({ label, value, subtext, icon, trend, trendValue }) => (
  <Card className="p-6">
    <div className="flex items-start justify-between mb-3">
      <span className="text-ink-500 text-xs font-medium uppercase tracking-wider">{label}</span>
      {icon && <div className="text-ink-400">{icon}</div>}
    </div>
    <p className="text-3xl font-bold text-ink-900 tabular tracking-tighter-2 mb-1">{value}</p>
    {(subtext || trend) && (
      <div className="flex items-center gap-2 text-sm">
        {trend && trendValue && (
          <span
            className={cn(
              'text-xs font-medium',
              trend === 'up' && 'text-accent-600',
              trend === 'down' && 'text-red-500',
              trend === 'neutral' && 'text-ink-500'
            )}
          >
            {trend === 'up' && '↑'} {trend === 'down' && '↓'} {trendValue}
          </span>
        )}
        {subtext && <span className="text-ink-500">{subtext}</span>}
      </div>
    )}
  </Card>
)
