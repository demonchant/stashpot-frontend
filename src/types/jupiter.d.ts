export {}

type JupiterFormProps = {
  swapMode?: 'ExactInOrOut' | 'ExactIn' | 'ExactOut'
  initialAmount?: string
  initialInputMint?: string
  initialOutputMint?: string
  fixedAmount?: boolean
  fixedMint?: string
}

type JupiterInit = {
  localStoragePrefix?: string
  formProps?: JupiterFormProps
  defaultExplorer?: 'Solana Explorer' | 'Solscan' | 'Solana Beach' | 'SolanaFM'
  displayMode?: 'modal' | 'integrated' | 'widget'
  integratedTargetId?: string
  containerStyles?: Record<string, string>
  enableWalletPassthrough?: boolean
  passthroughWalletContextState?: unknown
  onRequestConnectWallet?: () => void | Promise<void>
  onSuccess?: (result: { txid: string; swapResult?: unknown; quoteResponseMeta?: unknown }) => void
  onSwapError?: (result: { error?: unknown; quoteResponseMeta?: unknown }) => void
}

declare global {
  interface Window {
    Jupiter?: {
      init: (props: JupiterInit) => void
      close: () => void
      syncProps: (props: Record<string, unknown>) => void
    }
  }
}
