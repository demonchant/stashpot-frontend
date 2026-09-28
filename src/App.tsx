import { FC, useEffect, useMemo } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom'
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare'
import { Toaster } from 'react-hot-toast'
import AOS from 'aos'
import '@solana/wallet-adapter-react-ui/styles.css'
import Layout from './components/Layout'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import FundWallet from './pages/FundWallet'
import { getMainnetRpcEndpoint } from './lib/rpc'
import Savings from './pages/Savings'
import Goals from './pages/Goals'
import TimeLockr from './pages/TimeLockr'
import PrizeSavings from './pages/PrizeSavings'
import Circles from './pages/Circles'
import Microloans from './pages/Microloans'
import Activity from './pages/Activity'
import Withdrawals from './pages/Withdrawals'
import Referrals from './pages/Referrals'
import Verify from './pages/Verify'
import Settings from './pages/Settings'

const App: FC = () => {
  const endpoint = useMemo(getMainnetRpcEndpoint, [])
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
              <Route path="/savings" element={<Savings />} />
              <Route path="/goals" element={<Goals />} />
              <Route path="/timelock" element={<TimeLockr />} />
              <Route path="/prize" element={<PrizeSavings />} />
              <Route path="/circles" element={<Circles />} />
              <Route path="/microloans" element={<Microloans />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/withdrawals" element={<Withdrawals />} />
              <Route path="/referrals" element={<Referrals />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/fiat" element={<Navigate to="/fund" replace />} />
              <Route path="/onramp" element={<Navigate to="/fund" replace />} />
              <Route path="/pools" element={<Navigate to="/prize" replace />} />
              <Route path="/vaults" element={<Navigate to="/timelock" replace />} />
              <Route path="/loans" element={<Navigate to="/microloans" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}

export default App
