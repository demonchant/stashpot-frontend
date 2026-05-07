import { FC } from 'react'

interface LogoProps {
  size?: number
  className?: string
}

/**
 * StashPot logo — uses the real brand asset at /stashpot-logo.png
 */
export const Logo: FC<LogoProps> = ({ size = 36, className = '' }) => (
  <img
    src="/stashpot-logo.png"
    alt="StashPot"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    style={{ width: size, height: size }}
  />
)
