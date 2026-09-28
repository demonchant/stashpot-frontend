import { PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js'
import type { ProjectZeroPosition, ProjectZeroRuntime } from './projectZero'

const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
const USDC_SCALE = 1_000_000

/** Minimal structural types around the official p0-ts-sdk. This keeps the
 * StashPot accounting model isolated from SDK churn while using the official
 * wrapper transaction builders at runtime. */
export interface P0SdkClientLike {
  getBank(address: PublicKey): any
  getAccountAddresses(authority: PublicKey): Promise<PublicKey[]>
  fetchAccount(address: PublicKey, skipHealthCache?: boolean): Promise<any>
  createMarginfiAccountWithProjection(authority: PublicKey, accountIndex?: number, thirdPartyId?: number): Promise<{ wrappedAccount: any; ix: any }>
  bankIntegrationMap: Record<string, any>
  assetShareValueMultiplierByBank: Map<string, any>
  connection?: { getSlot(commitment?: string): Promise<number> }
}

export class ProjectZeroSdkRuntime implements ProjectZeroRuntime {
  constructor(
    private readonly client: P0SdkClientLike,
    private readonly expectedAssetTag: number,
  ) {}

  async readIntegrationPosition(owner: string, bankAddress: string): Promise<ProjectZeroPosition> {
    const ownerPk = new PublicKey(owner)
    const bank = this.requireUsdcIntegrationBank(bankAddress)
    const addresses = await this.client.getAccountAddresses(ownerPk)
    if (!addresses.length) return { bankAddress, depositedAtomic: 0n, withdrawableAtomic: 0n, observedSlot: await this.slot() }

    let depositedUi = 0
    for (const address of addresses) {
      const account = await this.client.fetchAccount(address, true)
      const balance = account.getBalance(bank.address)
      const multiplier = this.client.assetShareValueMultiplierByBank.get(bank.address.toBase58())
      const quantity = balance.computeQuantityUi(bank, multiplier)
      depositedUi += Number(quantity.assets.toString())
    }

    const depositedAtomic = uiUsdcToAtomic(depositedUi.toString())
    // Project 0 exposes accounting value from share conversion. Immediate
    // venue liquidity is intentionally conservative until a withdraw quote or
    // simulation proves more is withdrawable.
    return { bankAddress, depositedAtomic, withdrawableAtomic: 0n, observedSlot: await this.slot() }
  }

  async buildIntegrationDeposit(owner: string, bankAddress: string, amountAtomic: bigint): Promise<Uint8Array[]> {
    const ownerPk = new PublicKey(owner)
    const bank = this.requireUsdcIntegrationBank(bankAddress)
    const account = await this.loadExisting(ownerPk)
    if (!account) throw new Error('Create the dedicated Project 0 StashPot account before the first strategy deposit')
    const amount = atomicUsdcToUi(amountAtomic)
    const meta = this.client.bankIntegrationMap[bank.address.toBase58()]
    let tx: any
    if (this.expectedAssetTag === 3) {
      const reserve = meta?.kaminoStates?.reserveState
      if (!reserve) throw new Error('Kamino integration metadata is unavailable')
      tx = await account.makeKaminoDepositTx(bank.address, amount, reserve)
    } else if (this.expectedAssetTag === 4) {
      const spotMarket = meta?.driftStates?.spotMarketState
      if (!spotMarket) throw new Error('Drift integration metadata is unavailable')
      tx = await account.makeDriftDepositTx(bank.address, amount, spotMarket)
    } else {
      throw new Error('Only Project 0 Kamino and Drift integration banks are approved')
    }
    return [serializeUnsigned(tx)]
  }

  async buildIntegrationWithdraw(owner: string, bankAddress: string, amountAtomic: bigint): Promise<Uint8Array[]> {
    const ownerPk = new PublicKey(owner)
    const bank = this.requireUsdcIntegrationBank(bankAddress)
    const account = await this.loadExisting(ownerPk)
    if (!account) throw new Error('Project 0 StashPot account does not exist')
    const amount = atomicUsdcToUi(amountAtomic)
    const meta = this.client.bankIntegrationMap[bank.address.toBase58()]
    let result: any
    if (this.expectedAssetTag === 3) {
      const reserve = meta?.kaminoStates?.reserveState
      if (!reserve) throw new Error('Kamino integration metadata is unavailable')
      result = await account.makeKaminoWithdrawTx(bank.address, amount, reserve, false)
    } else if (this.expectedAssetTag === 4) {
      const spotMarket = meta?.driftStates?.spotMarketState
      if (!spotMarket) throw new Error('Drift integration metadata is unavailable')
      result = await account.makeDriftWithdrawTx(bank.address, amount, spotMarket, false)
    } else {
      throw new Error('Only Project 0 Kamino and Drift integration banks are approved')
    }
    return result.transactions.map(serializeUnsigned)
  }

  private requireUsdcIntegrationBank(address: string): any {
    const bank = this.client.getBank(new PublicKey(address))
    if (!bank) throw new Error('Allowlisted Project 0 bank is not present in the live production group')
    if (bank.mint?.toBase58?.() !== USDC_MINT) throw new Error('Project 0 bank is not native Circle USDC')
    if (Number(bank.config?.assetTag) !== this.expectedAssetTag) throw new Error('Project 0 bank asset tag does not match the configured venue')
    if (bank.config?.operationalState !== undefined && /paused|reduce/i.test(String(bank.config.operationalState))) {
      throw new Error('Project 0 bank is not open for new deposits')
    }
    return bank
  }

  private async loadExisting(owner: PublicKey): Promise<any | null> {
    const addresses = await this.client.getAccountAddresses(owner)
    if (!addresses.length) return null
    return this.client.fetchAccount(addresses[0])
  }

  private async slot(): Promise<number | undefined> {
    try { return await this.client.connection?.getSlot('confirmed') } catch { return undefined }
  }
}

export function atomicUsdcToUi(amount: bigint): string {
  if (amount < 0n) throw new Error('USDC amount cannot be negative')
  const whole = amount / BigInt(USDC_SCALE)
  const fraction = (amount % BigInt(USDC_SCALE)).toString().padStart(6, '0').replace(/0+$/, '')
  return fraction ? `${whole}.${fraction}` : whole.toString()
}

export function uiUsdcToAtomic(value: string): bigint {
  if (!/^\d+(\.\d{1,6})?$/.test(value)) throw new Error('Invalid USDC quantity')
  const [whole, fraction = ''] = value.split('.')
  return BigInt(whole) * BigInt(USDC_SCALE) + BigInt(fraction.padEnd(6, '0'))
}

function serializeUnsigned(tx: Transaction | VersionedTransaction): Uint8Array {
  if (tx instanceof VersionedTransaction) return tx.serialize()
  return tx.serialize({ requireAllSignatures: false, verifySignatures: false })
}
