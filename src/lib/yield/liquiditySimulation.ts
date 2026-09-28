import { Transaction, VersionedTransaction, type Connection } from '@solana/web3.js'
import { atomicUsdcToUi } from './projectZeroSdkRuntime'

export interface WithdrawSimulation {
  requestedAtomic: bigint
  sdkMaximumAtomic: bigint
  simulated: boolean
  executable: boolean
  error?: string
  unitsConsumed?: number
}

/** Bank-aware preflight. Project 0's max-withdraw calculation includes account
 * health, venue/bank liquidity and enabled outflow limits. A transaction must
 * still simulate successfully immediately before wallet signing. */
export async function simulateProjectZeroWithdraw(
  connection: Connection,
  wrappedAccount: any,
  bankAddress: string,
  requestedAtomic: bigint,
  build: () => Promise<Transaction | VersionedTransaction>,
): Promise<WithdrawSimulation> {
  if (requestedAtomic <= 0n) throw new Error('Withdrawal must be positive')
  const maxUi = wrappedAccount.computeMaxWithdrawForBank(new (await import('@solana/web3.js')).PublicKey(bankAddress))
  const sdkMaximumAtomic = uiToAtomicFloor(maxUi.toString())
  if (requestedAtomic > sdkMaximumAtomic) {
    return { requestedAtomic, sdkMaximumAtomic, simulated: false, executable: false, error: 'Requested amount exceeds current Project 0 withdrawable liquidity/limits' }
  }
  try {
    const tx = await build()
    const result = tx instanceof VersionedTransaction
      ? await connection.simulateTransaction(tx, { sigVerify: false, replaceRecentBlockhash: true })
      : await connection.simulateTransaction(tx)
    return {
      requestedAtomic,
      sdkMaximumAtomic,
      simulated: true,
      executable: !result.value.err,
      error: result.value.err ? JSON.stringify(result.value.err) : undefined,
      unitsConsumed: result.value.unitsConsumed ?? undefined,
    }
  } catch (error) {
    return { requestedAtomic, sdkMaximumAtomic, simulated: true, executable: false, error: error instanceof Error ? error.message : String(error) }
  }
}

function uiToAtomicFloor(value: string): bigint {
  const match = value.match(/^(\d+)(?:\.(\d+))?$/)
  if (!match) throw new Error(`Invalid Project 0 amount: ${value}`)
  const frac = (match[2] ?? '').slice(0, 6).padEnd(6, '0')
  return BigInt(match[1]) * 1_000_000n + BigInt(frac || '0')
}

export function requestedWithdrawUi(amount: bigint) { return atomicUsdcToUi(amount) }
