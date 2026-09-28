import { Connection, PublicKey } from '@solana/web3.js'
import { AssetTag, Project0Client, getConfig } from '@0dotxyz/p0-ts-sdk'

const USDC = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v')
const rpc = process.env.SOLANA_RPC_URL
if (!rpc || !/^https:\/\//.test(rpc)) throw new Error('Set SOLANA_RPC_URL to a dedicated HTTPS Solana mainnet RPC')

const connection = new Connection(rpc, 'confirmed')
const config = getConfig('production')
const client = await Project0Client.initialize(connection, config)

function summarize(venue, tag) {
  return (client.getBanksByMint(USDC, tag) ?? []).map((bank) => ({
    venue,
    bank: bank.address.toBase58(),
    mint: bank.mint.toBase58(),
    assetTag: Number(bank.config.assetTag),
    operationalState: String(bank.config.operationalState),
    tokenSymbol: bank.tokenSymbol,
    oracleKeys: (bank.config.oracleKeys ?? []).map((k) => k.toBase58?.() ?? String(k)),
    integrationMetadataPresent: Boolean(client.bankIntegrationMap?.[bank.address.toBase58()]),
    multiplierPresent: Boolean(client.assetShareValueMultiplierByBank?.get(bank.address.toBase58())),
  }))
}

const result = {
  observedAt: new Date().toISOString(),
  rpcHost: new URL(rpc).host,
  programId: config.programId.toBase58(),
  group: config.groupPk.toBase58(),
  nativeUsdcMint: USDC.toBase58(),
  kamino: summarize('kamino', AssetTag.KAMINO),
  drift: summarize('drift', AssetTag.DRIFT),
}
console.log(JSON.stringify(result, null, 2))
