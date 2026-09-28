import { FC, useCallback, useEffect, useState } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import {
  ArrowDownUp,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Button } from '../components/Button'
import { Card } from '../components/Card'
import { SEO } from '../components/SEO'
import { useWalletBalances } from '../hooks/useWalletBalances'
import {
  solscanAccountUrl,
  solscanTransactionUrl,
  USDC_MAINNET_MINT_ADDRESS,
  waitForSignatureConfirmation,
  WRAPPED_SOL_MINT_ADDRESS,
} from '../lib/solana'
import { formatUSDC, shortAddress } from '../lib/utils'

const FundWallet: FC = () => {
  const wallet = useWallet()
  const { connection } = useConnection()
  const { setVisible } = useWalletModal()
  const { usdc, loading, error, refresh } = useWalletBalances()
  const [copied, setCopied] = useState<'wallet' | 'mint' | null>(null)
  const [pluginReady, setPluginReady] = useState(false)
  const [swapReceipt, setSwapReceipt] = useState<{
    signature: string
    status: 'confirming' | 'confirmed' | 'failed'
    message?: string
  } | null>(null)

  const address = wallet.publicKey?.toBase58() || ''

  const copy = useCallback(async (value: string, kind: 'wallet' | 'mint') => {
    await navigator.clipboard.writeText(value)
    setCopied(kind)
    toast.success(kind === 'wallet' ? 'Wallet address copied' : 'Official USDC mint copied')
    window.setTimeout(() => setCopied(null), 1800)
  }, [])

  const handleSwapSuccess = useCallback(async ({ txid }: { txid: string }) => {
    setSwapReceipt({ signature: txid, status: 'confirming' })
    try {
      await waitForSignatureConfirmation(connection, txid)
      setSwapReceipt({ signature: txid, status: 'confirmed' })
      toast.success(`Swap confirmed: ${shortAddress(txid, 6)}`)
      await refresh()
    } catch (confirmationError) {
      const message = confirmationError instanceof Error ? confirmationError.message : 'Could not confirm the swap'
      setSwapReceipt({ signature: txid, status: 'failed', message })
      toast.error(message)
    }
  }, [connection, refresh])

  const handleSwapError = useCallback(({ error }: { error?: unknown }) => {
    const rawMessage = error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error
        ? String((error as { message?: unknown }).message)
        : ''
    const message = /reject|declin|cancel/i.test(rawMessage)
      ? 'Swap cancelled in your wallet.'
      : rawMessage || 'Swap failed. Check your token balance, SOL for fees, and quote details.'
    toast.error(message)
  }, [])

  useEffect(() => {
    let attempts = 0
    let timer: number | undefined

    const initialize = () => {
      if (!window.Jupiter) {
        attempts += 1
        if (attempts < 80) timer = window.setTimeout(initialize, 125)
        return
      }

      window.Jupiter.close()
      window.Jupiter.init({
        displayMode: 'integrated',
        integratedTargetId: 'jupiter-usdc-swap',
        containerStyles: {
          width: '100%',
          height: '560px',
          borderRadius: '16px',
          overflow: 'hidden',
        },
        formProps: {
          swapMode: 'ExactIn',
          initialInputMint: WRAPPED_SOL_MINT_ADDRESS,
          initialOutputMint: USDC_MAINNET_MINT_ADDRESS,
        },
        defaultExplorer: 'Solscan',
        localStoragePrefix: 'stashpot-jupiter',
        enableWalletPassthrough: true,
        passthroughWalletContextState: wallet,
        onRequestConnectWallet: () => setVisible(true),
        onSuccess: handleSwapSuccess,
        onSwapError: handleSwapError,
      })
      setPluginReady(true)
    }

    initialize()
    return () => {
      if (timer) window.clearTimeout(timer)
      window.Jupiter?.close()
    }
  }, [handleSwapError, handleSwapSuccess, setVisible])

  useEffect(() => {
    window.Jupiter?.syncProps({ passthroughWalletContextState: wallet })
  }, [wallet])

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <SEO
        title="Fund Wallet"
        description="Receive native USDC on Solana mainnet or swap existing Solana assets to USDC through Jupiter."
      />

      <div>
        <div className="inline-flex items-center gap-2 rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700 mb-3">
          <ShieldCheck size={14} /> Solana mainnet · self-custodial
        </div>
        <h1 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">
          Fund your wallet
        </h1>
        <p className="text-ink-600 mt-3 max-w-3xl">
          No payment-provider contract is required. Receive native USDC directly, or swap assets already in your Solana wallet to USDC. StashPot never receives or holds your funds.
        </p>
      </div>

      {!wallet.connected || !address ? (
        <Card className="p-10 text-center">
          <Wallet size={42} className="mx-auto mb-4 text-royal-600" />
          <h2 className="text-2xl font-bold text-ink-950 mb-2">Connect your wallet</h2>
          <p className="text-ink-600 mb-6">Connect Phantom or Solflare to see your deposit address and live mainnet USDC balance.</p>
          <Button onClick={() => setVisible(true)}>Connect Solana wallet</Button>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-5">
                <div>
                  <p className="text-xs uppercase tracking-wider text-ink-500 mb-1">Native USDC balance</p>
                  <p className="text-4xl font-bold tracking-tight text-ink-950">{formatUSDC(usdc)}</p>
                </div>
                <Button variant="secondary" loading={loading} onClick={refresh} leftIcon={<RefreshCw size={15} />}>
                  Refresh
                </Button>
              </div>
              {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

              <div className="rounded-xl bg-ink-50 border border-ink-200 p-4">
                <p className="text-xs uppercase tracking-wider text-ink-500 mb-2">Your Solana address</p>
                <div className="flex items-center gap-3">
                  <code className="text-sm text-ink-900 break-all flex-1">{address}</code>
                  <button
                    onClick={() => copy(address, 'wallet')}
                    className="p-2 rounded-lg bg-white border border-ink-200 hover:border-royal-400"
                    aria-label="Copy wallet address"
                  >
                    {copied === 'wallet' ? <Check size={16} className="text-accent-600" /> : <Copy size={16} />}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                <strong>Important:</strong> when withdrawing from an exchange, choose the <strong>Solana</strong> network and native USDC. A transfer on Ethereum, Base, BNB Chain, or another network will not arrive at this address.
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="font-bold text-ink-950 mb-4">Verify the asset</h2>
              <p className="text-sm text-ink-600 mb-3">Official Circle-issued USDC mint on Solana mainnet:</p>
              <code className="block text-xs break-all rounded-lg bg-ink-50 border border-ink-200 p-3 text-ink-800">
                {USDC_MAINNET_MINT_ADDRESS}
              </code>
              <div className="flex gap-2 mt-3">
                <Button variant="secondary" size="sm" onClick={() => copy(USDC_MAINNET_MINT_ADDRESS, 'mint')} leftIcon={copied === 'mint' ? <Check size={14} /> : <Copy size={14} />}>
                  Copy mint
                </Button>
                <a href={solscanAccountUrl(address)} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm" rightIcon={<ExternalLink size={13} />}>Solscan</Button>
                </a>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            <Card className="lg:col-span-3 p-3 min-h-[590px]">
              <div className="flex items-center gap-2 px-3 pt-3 mb-2">
                <ArrowDownUp size={18} className="text-royal-600" />
                <h2 className="font-bold text-ink-950">Swap to USDC with Jupiter</h2>
              </div>
              {!pluginReady && (
                <div className="h-[520px] flex items-center justify-center text-sm text-ink-500">Loading Jupiter swap…</div>
              )}
              <div id="jupiter-usdc-swap" className={pluginReady ? 'block' : 'hidden'} />
              {swapReceipt && (
                <div className={`mx-3 mb-3 rounded-xl border p-4 text-sm ${
                  swapReceipt.status === 'confirmed'
                    ? 'border-accent-200 bg-accent-50 text-accent-900'
                    : swapReceipt.status === 'failed'
                      ? 'border-red-200 bg-red-50 text-red-800'
                      : 'border-amber-200 bg-amber-50 text-amber-900'
                }`}>
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <span className="font-semibold capitalize">Swap {swapReceipt.status}</span>
                    <a href={solscanTransactionUrl(swapReceipt.signature)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline">
                      {shortAddress(swapReceipt.signature, 8)} <ExternalLink size={13} />
                    </a>
                  </div>
                  {swapReceipt.message && <p className="mt-1">{swapReceipt.message}</p>}
                </div>
              )}
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <Card className="p-6">
                <h3 className="font-bold text-ink-950 mb-3">From cash to USDC</h3>
                <ol className="space-y-3 text-sm text-ink-600 list-decimal pl-5">
                  <li>Buy USDC or SOL using any exchange or P2P service legally available to you.</li>
                  <li>Withdraw it to the Solana address shown above. Select the Solana network.</li>
                  <li>If you withdrew SOL or another token, use the Jupiter panel to swap it to native USDC.</li>
                  <li>Refresh your balance and verify the transfer on Solscan.</li>
                </ol>
              </Card>
              <Card className="p-6 border-accent-200 bg-accent-50">
                <h3 className="font-bold text-ink-950 mb-2">No StashPot deposit address</h3>
                <p className="text-sm text-ink-700">The address displayed is your connected wallet. There is no company wallet, virtual balance, or manual crediting step.</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-bold text-ink-950 mb-2">Swap safeguards</h3>
                <p className="text-sm text-ink-600">SOL is the initial source and native USDC is the initial destination. You can select another supported Solana source token. Jupiter shows balances, route, expected output, price impact, fees and slippage before your wallet asks you to sign.</p>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default FundWallet
