import { FC, InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightAddon?: ReactNode
  hint?: string
}

export const Input: FC<InputProps> = ({
  label, error, leftIcon, rightAddon, hint, className, ...props
}) => (
  <div className="w-full">
    {label && (
      <label className="block text-ink-700 text-xs font-medium uppercase tracking-wider mb-2">
        {label}
      </label>
    )}
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400">{leftIcon}</div>
      )}
      <input
        className={cn(
          'w-full bg-white border border-ink-200 rounded-xl',
          'px-4 py-3 text-ink-900 placeholder:text-ink-400',
          'focus:outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100',
          'transition-all duration-200',
          leftIcon && 'pl-11',
          rightAddon && 'pr-20',
          error && 'border-red-300',
          className
        )}
        {...props}
      />
      {rightAddon && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500 text-sm font-medium">
          {rightAddon}
        </div>
      )}
    </div>
    {error && <p className="text-red-500 text-xs mt-1.5">{error}</p>}
    {hint && !error && <p className="text-ink-500 text-xs mt-1.5">{hint}</p>}
  </div>
)
