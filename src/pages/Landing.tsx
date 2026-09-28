import { FC } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, ArrowDownUp, CheckCircle2, Copy, ShieldCheck, Wallet, WalletCards, type LucideIcon } from 'lucide-react'
import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { SEO } from '../components/SEO'
import { IMG } from '../lib/images'
import { USDC_MAINNET_MINT_ADDRESS } from '../lib/solana'

const Landing: FC = () => (
  <div className="bg-white text-ink-900 overflow-x-hidden">
    <SEO title="Personal USDC wallet on Solana" description="Track, receive, and swap to native USDC in your own Solana mainnet wallet. No custodial balance and no payment-provider contract." canonical="https://stashpot-frontendd.vercel.app/" />
    <NavBar />

    <section className="relative min-h-screen flex items-center pt-16">
      <div className="absolute inset-0 z-0"><img src={IMG.hero} alt="Building personal savings" className="w-full h-full object-cover" loading="eager" fetchPriority="high" /><div className="absolute inset-0 hero-overlay" /></div>
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24 w-full">
        <div className="max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-accent-200 mb-8 shadow-soft"><ShieldCheck size={13} className="text-accent-600" /><span className="text-xs font-semibold text-accent-800">Live on Solana mainnet · self-custodial</span></div>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.2rem] font-bold tracking-tightest text-ink-950 leading-[1.02] mb-6 text-balance">Your USDC.<br /><span className="gradient-brand">Your wallet. Your control.</span></h1>
          <p className="text-lg lg:text-xl text-ink-800 max-w-2xl mb-9 leading-relaxed font-medium">Receive native USDC directly on Solana, swap assets to USDC through Jupiter, and track a personal savings goal—without a suspended backend or an expensive on-ramp partnership.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-royal-600 to-royal-700 text-white text-sm font-semibold hover:from-royal-700 hover:to-royal-800 shadow-royal"><WalletCards size={16} /> Open mainnet app <ArrowRight size={14} /></Link>
            <Link to="/fund" className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-ink-300 text-sm font-semibold text-ink-900 hover:border-royal-400"><Wallet size={16} /> Fund wallet</Link>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-7 gap-y-2 text-sm text-ink-700 font-medium"><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-accent-600" /> No custody</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-accent-600" /> No fake credits</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={15} className="text-accent-600" /> Native Circle USDC only</span></div>
        </div>
      </div>
    </section>

    <section id="funding" className="py-24 bg-ink-50">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="max-w-2xl mb-12"><p className="text-royal-700 text-sm font-semibold mb-2">Fund without an integration contract</p><h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950">Three straightforward paths</h2></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FundingCard icon={Copy} number="01" title="Receive USDC" text="Copy your connected Solana address and withdraw native USDC to it from any service you already use." />
          <FundingCard icon={ArrowDownUp} number="02" title="Swap with Jupiter" text="Convert SOL or another supported Solana asset to native USDC inside the app through Jupiter Ultra." />
          <FundingCard icon={Wallet} number="03" title="Track on-chain" text="Refresh the dashboard to read your real USDC and SOL balances directly from Solana mainnet." />
        </div>
      </div>
    </section>

    <section id="how" className="py-24">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div><p className="text-royal-700 text-sm font-semibold mb-2">How it works</p><h2 className="text-4xl font-bold tracking-tight text-ink-950 mb-5">The blockchain is the source of truth</h2><p className="text-ink-600 leading-relaxed mb-6">StashPot does not maintain an internal “USDC balance.” It queries token accounts belonging to your connected wallet and counts only Circle-issued native USDC.</p><Link to="/fund" className="inline-flex items-center gap-2 text-royal-700 font-semibold">See funding options <ArrowRight size={15} /></Link></div>
        <div className="rounded-2xl bg-ink-950 text-white p-7 shadow-soft-lg"><p className="text-xs uppercase tracking-wider text-ink-400 mb-3">Official Solana USDC mint</p><code className="text-sm break-all text-accent-300">{USDC_MAINNET_MINT_ADDRESS}</code><p className="text-sm text-ink-300 mt-5">Always verify this mint and choose the Solana network before confirming an exchange withdrawal.</p></div>
      </div>
    </section>

    <section id="security" className="py-24 bg-royal-950 text-white">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center"><ShieldCheck size={44} className="mx-auto text-accent-400 mb-5" /><h2 className="text-4xl font-bold mb-5">No seed phrase. No private key. No custody.</h2><p className="text-white/75 max-w-2xl mx-auto text-lg">Your wallet signs swaps and retains the assets. StashPot never asks for recovery words and never routes deposits through a company wallet.</p></div>
    </section>

    <section id="faq" className="py-24">
      <div className="max-w-4xl mx-auto px-6 lg:px-10"><h2 className="text-4xl font-bold text-ink-950 mb-10">Common questions</h2><div className="space-y-4"><Faq q="Can I use real USDC?" a="Yes. This build is pinned to Solana mainnet and reads Circle-issued native USDC with real financial value." /><Faq q="Do I need Paystack, Yellow Card, or Transak?" a="No. You can transfer native USDC to your own wallet or swap assets already on Solana through Jupiter." /><Faq q="Are prize pools and loans live?" a="No. They remain disabled until verified, audited StashPot mainnet programs exist. The app will not send real funds to unverified contracts." /></div></div>
    </section>

    <Footer />
  </div>
)

const FundingCard: FC<{ icon: LucideIcon; number: string; title: string; text: string }> = ({ icon: Icon, number, title, text }) => (
  <div className="rounded-2xl border border-ink-200 bg-white p-7 shadow-soft"><div className="flex items-center justify-between mb-6"><div className="w-11 h-11 rounded-xl bg-royal-50 flex items-center justify-center"><Icon size={21} className="text-royal-700" /></div><span className="font-mono text-ink-400 text-sm">{number}</span></div><h3 className="text-xl font-bold text-ink-950 mb-2">{title}</h3><p className="text-sm text-ink-600 leading-relaxed">{text}</p></div>
)

const Faq: FC<{ q: string; a: string }> = ({ q, a }) => <div className="rounded-xl border border-ink-200 p-5"><h3 className="font-bold text-ink-950 mb-2">{q}</h3><p className="text-sm text-ink-600 leading-relaxed">{a}</p></div>

export default Landing
