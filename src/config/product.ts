import { PublicKey } from '@solana/web3.js'

export type ProgramFeature = 'personalSavings' | 'timelock' | 'prizeSavings' | 'circles' | 'microloans'

type ProgramConfig = {
  label: string
  envValue?: string
}

const PROGRAMS: Record<ProgramFeature, ProgramConfig> = {
  personalSavings: { label: 'Personal Savings', envValue: import.meta.env.VITE_PERSONAL_SAVINGS_PROGRAM_ID },
  timelock: { label: 'TimeLockr', envValue: import.meta.env.VITE_TIMELOCK_PROGRAM_ID },
  prizeSavings: { label: 'Prize Savings', envValue: import.meta.env.VITE_PRIZE_SAVINGS_PROGRAM_ID },
  circles: { label: 'Savings Circles', envValue: import.meta.env.VITE_CIRCLES_PROGRAM_ID },
  microloans: { label: 'Microloans', envValue: import.meta.env.VITE_MICROLOANS_PROGRAM_ID },
}

export const MAINNET_PROGRAMS_ENABLED = import.meta.env.VITE_STASHPOT_MAINNET_PROGRAMS_ENABLED === 'true'

function validProgramId(value?: string): string | null {
  if (!value) return null
  try {
    const id = new PublicKey(value).toBase58()
    return id === '11111111111111111111111111111111' ? null : id
  } catch {
    return null
  }
}

export function programStatus(feature: ProgramFeature) {
  const config = PROGRAMS[feature]
  const programId = validProgramId(config.envValue)
  const enabled = Boolean(programId && MAINNET_PROGRAMS_ENABLED)
  return {
    feature,
    label: config.label,
    programId,
    enabled,
    reason: !programId
      ? 'No reviewed mainnet program ID is configured.'
      : !MAINNET_PROGRAMS_ENABLED
        ? 'Program ID is present, but deliberate mainnet activation is off.'
        : null,
  }
}

export const PRODUCT_ROUTE_PATHS = [
  '/dashboard',
  '/fund',
  '/savings',
  '/goals',
  '/timelock',
  '/prize',
  '/circles',
  '/microloans',
  '/activity',
  '/withdrawals',
  '/referrals',
  '/verify',
  '/settings',
] as const

