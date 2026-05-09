import { FC, useMemo, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { PrivyProvider } from '@privy-io/react-auth'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import '@solana/wallet-adapter-react-ui/styles.css'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import Pools from './pages/Pools'
import Vaults from './pages/Vaults'
import Circles from './pages/Circles'
import Loans from './pages/Loans'
import OnRamp from './pages/OnRamp'
import Referrals from './pages/Referrals'
import Verify from './pages/Verify'

const App: FC = () => {
  const network = (import.meta.env.VITE_NETWORK as WalletAdapterNetwork) || WalletAdapterNetwork.Devnet
  const endpoint = useMemo(() => {
    if (import.meta.env.VITE_SOLANA_RPC_URL) return import.meta.env.VITE_SOLANA_RPC_URL
    return clusterApiUrl(network)
  }, [network])

  const wallets = useMemo(() => [new PhantomWalletAdapter(), new SolflareWalletAdapter()], [])

  useEffect(() => {
    AOS.init({ duration: 800, once: true, offset: 50 })
  }, [])

  return (
    <PrivyProvider
      appId={import.meta.env.VITE_PRIVY_APP_ID}
      config={{
        loginMethods: ['email', 'wallet'],
        appearance: {
          theme: 'light',
          accentColor: '#7c3aed',
          logo: 'https://stashpot-frontendd.vercel.app/stashpot-logo.png',
        },
        embeddedWallets: {
          createOnLogin: 'off',
        },
        externalWallets: {
          solana: {
            connectors: ['phantom', 'solflare']
          }
        }
      }}
    >
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <Toaster position="top-center" />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/pools" element={<Pools />} />
                <Route path="/vaults" element={<Vaults />} />
                <Route path="/circles" element={<Circles />} />
                <Route path="/loans" element={<Loans />} />
                <Route path="/onramp" element={<OnRamp />} />
                <Route path="/referrals" element={<Referrals />} />
                <Route path="/verify" element={<Verify />} />
              </Route>
            </Routes>
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </PrivyProvider>
  )
}

export default App
