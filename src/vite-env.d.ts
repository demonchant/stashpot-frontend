/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_PRIVY_APP_ID: string
  readonly VITE_SOLANA_RPC_URL: string
  readonly VITE_SOLANA_MAINNET_RPC_URL: string
  readonly VITE_NETWORK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
