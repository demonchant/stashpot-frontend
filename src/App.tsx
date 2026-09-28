import { FC, useEffect, useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { clusterApiUrl } from '@solana/web3.js'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import '@solana/wallet-adapter-react-ui/styles.css'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import FundWallet from './pages/FundWallet'

const App: FC = () => {
  const endpoint = useMemo(
    () => import.meta.env.VITE_SOLANA_MAINNET_RPC_URL || clusterApiUrl(WalletAdapterNetwork.Mainnet),
    [],
  )
  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter({ network: WalletAdapterNetwork.Mainnet })],
    [],
  )

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 })
  }, [])

  return (
    <ConnectionProvider endpoint={endpoint} config={{ commitment: 'confirmed' }}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <Toaster position="top-center" />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/fund" element={<FundWallet />} />
              <Route path="/fiat" element={<Navigate to="/fund" replace />} />
              <Route path="/onramp" element={<Navigate to="/fund" replace />} />
              <Route path="/pools" element={<Navigate to="/dashboard" replace />} />
              <Route path="/vaults" element={<Navigate to="/dashboard" replace />} />
              <Route path="/circles" element={<Navigate to="/dashboard" replace />} />
              <Route path="/loans" element={<Navigate to="/dashboard" replace />} />
              <Route path="/referrals" element={<Navigate to="/dashboard" replace />} />
              <Route path="/verify" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
