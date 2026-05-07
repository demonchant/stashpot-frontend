import { clsx, type ClassValue } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatUSDC(num: number | string, showSymbol = true): string {
  const n = typeof num === 'string' ? parseFloat(num) : num
  if (isNaN(n)) return showSymbol ? '$0.00' : '0.00'
  const formatted = n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return showSymbol ? `$${formatted}` : formatted
}

export function shortAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars)}...${address.slice(-chars)}`
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function getErrorMessage(error: any): string {
  if (error?.response?.data?.error) return error.response.data.error
  if (error?.message) return error.message
  return 'An unexpected error occurred'
}
