import { FC, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'

import {
  ArrowRight, Trophy, Lock, Users, HandCoins, Banknote,
  ShieldCheck, TrendingUp, Sparkles, CheckCircle2, Zap,
  ChevronRight, Star, FileCheck2, KeyRound, Eye, Mail, Wallet,
} from 'lucide-react'

import NavBar from '../components/NavBar'
import Footer from '../components/Footer'
import { SEO } from '../components/SEO'
import { IMG, PARTNERS } from '../lib/images'
import { PARTNER_MARKS } from '../components/PartnerLogos'
import { api } from '../lib/api'
import { formatUSDC } from '../lib/utils'
import { useStashpotAuth } from '../hooks/useStashpotAuth'
import { useAuthStore } from '../store/auth'

const Landing: FC = () => {
  const { authenticated } = usePrivy()
  const { token } = useAuthStore()
  const { signIn } = useStashpotAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    api.getProtocolInfo().then(setStats).catch(() => {
      setStats({ tvl_usdc: 0, total_winners: 0, blended_apy: 8.74, total_deposits: 0 })
    })
  }, [])

  // Redirect to dashboard once auth is fully complete
  useEffect(() => {
    if (token) navigate('/dashboard')
  }, [token, navigate])

  return (
    <div className="bg-white text-ink-900 overflow-x-hidden">
      <SEO
        title="Save with intent. Win by chance."
        description="A savings protocol on Solana. Deposit USDC, earn DeFi yield, and enter prize draws funded entirely by that yield. Inheritance and escrow vaults included. Built for African markets."
        canonical="https://stashpot.io/"
      />

      <NavBar />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  HERO                                                    */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0 z-0">
          <img
            src={IMG.hero}
            alt="Family enjoying their savings together"
            className="w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          <div className="absolute inset-0 hero-overlay" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-32 w-full">
          <div className="max-w-4xl">
            {/* Status pill — static gold star, no blinking */}
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md border border-royal-200 mb-8 shadow-soft"
              data-aos="fade-up"
            >
              <Star size={12} className="text-gold-500 fill-gold-400" />
              <span className="text-xs font-semibold text-royal-700 tracking-wide">
                Building for the Colosseum Solana Frontier Hackathon
              </span>
            </div>

            <h1
              className="text-5xl sm:text-6xl lg:text-7xl xl:text-[5.5rem] font-bold tracking-tightest text-ink-950 leading-[1.02] mb-6 text-balance"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              Save with intent.<br />
              <span className="gradient-brand">Win by chance.</span>
            </h1>

            <p
              className="text-lg lg:text-xl text-ink-800 max-w-2xl mb-10 leading-relaxed font-medium"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              StashPot is a savings protocol on Solana. Deposit your USDC, earn yield from leading DeFi platforms, and enter prize draws funded entirely by that yield. Your principal stays yours. Withdraw anytime.
            </p>

            <div
              className="flex flex-wrap gap-3 mb-12"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <button
                onClick={() => signIn()}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-royal-600 to-royal-700 text-white text-sm font-semibold hover:from-royal-700 hover:to-royal-800 transition-all shadow-royal"
              >
                <Mail size={16} />
                Get started
                <ArrowRight size={14} />
              </button>
              <a
                href="#features"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white border border-ink-300 text-sm font-semibold text-ink-900 hover:border-royal-400 hover:text-royal-700 transition-all shadow-soft"
              >
                See how it works <ArrowRight size={14} />
              </a>
            </div>

            {/* Auth method hint — sets expectations */}
            <p
              className="text-xs text-ink-600 mb-8 flex flex-wrap items-center gap-x-4 gap-y-1"
              data-aos="fade-up"
              data-aos-delay="350"
            >
              <span className="inline-flex items-center gap-1.5">
                <Mail size={12} className="text-royal-600" /> Email magic link
              </span>
              <span className="text-ink-300">·</span>
              <span className="inline-flex items-center gap-1.5">
                <Wallet size={12} className="text-royal-600" /> Phantom, Solflare & 50+ wallets
              </span>
              <span className="text-ink-300">·</span>
              <span>Google · Passkey</span>
            </p>

            {/* Trust strip */}
            <div
              className="flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-ink-700 font-medium"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-royal-600" />
                <span>Your savings stay yours</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-royal-600" />
                <span>Audited Solana vaults</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-royal-600" />
                <span>Provably fair draws</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-royal-600" />
                <span>Withdraw any time</span>
              </div>
            </div>
          </div>

          {/* Stats card */}
          <div
            className="mt-16 lg:mt-24 grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink-200 border border-ink-200 rounded-2xl overflow-hidden shadow-soft-lg max-w-5xl"
            data-aos="fade-up"
            data-aos-delay="500"
          >
            {[
              { label: 'Average Yield',   value: `${stats?.blended_apy ?? 8.74}%`, accent: true },
              { label: 'Total Saved',     value: stats ? formatUSDC(stats.tvl_usdc, false) : '—' },
              { label: 'Total Winners',   value: stats?.total_winners ?? 0 },
              { label: 'Network',         value: 'Solana' },
            ].map((s, i) => (
              <div key={i} className="bg-white p-6 lg:p-7">
                <p className="text-ink-500 text-xs uppercase tracking-wider font-semibold mb-2">
                  {s.label}
                </p>
                <p
                  className={`text-2xl lg:text-3xl font-bold tabular tracking-tighter-2 ${
                    s.accent ? 'gradient-royal' : 'text-ink-900'
                  }`}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  PARTNERS — real brand logos                             */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-12 border-y border-ink-100 bg-ink-50/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <p className="text-center text-xs font-semibold text-ink-500 uppercase tracking-widest mb-8">
            Powered by the best of Solana DeFi
          </p>
          <div className="overflow-hidden">
            <div className="flex items-center gap-12 marquee whitespace-nowrap">
              {[...PARTNERS, ...PARTNERS].map((name, i) => {
                const LogoComp = PARTNER_MARKS[name]
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 text-ink-500 hover:text-ink-900 transition-colors"
                    aria-label={name}
                  >
                    {LogoComp ? <LogoComp className="h-9 w-auto" /> : <span className="text-lg font-bold">{name}</span>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  CAROUSEL — 15s autoplay                                 */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32" data-aos="fade-up">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <p className="title-accent text-sm font-bold text-gold-600 uppercase tracking-widest mb-4">
              See it in action
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950 mb-4 text-balance">
              The full picture.
            </h2>
            <p className="text-lg text-ink-600 leading-relaxed">
              From dashboards to draws, from inheritance to escrow, from local on ramps to verifiable fairness. Every layer of the protocol, in one tour.
            </p>
          </div>

          <Swiper
            modules={[Autoplay, Pagination, Navigation, EffectFade]}
            spaceBetween={24}
            slidesPerView={1}
            loop
            autoplay={{
              delay: 15000,                  // 15 seconds per slide as requested
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={900}
            pagination={{ clickable: true }}
            navigation
            effect="fade"
            fadeEffect={{ crossFade: true }}
            className="rounded-3xl overflow-hidden shadow-soft-xl border border-ink-200"
          >
            {IMG.carousel.map((slide, i) => (
              <SwiperSlide key={i}>
                <div className="relative aspect-[16/9] lg:aspect-[21/9] bg-ink-900">
                  <img
                    src={slide.url}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    loading={i === 0 ? 'eager' : 'lazy'}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/40 to-transparent" />
                  <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-16">
                    <div className="max-w-2xl">
                      <h3 className="text-3xl lg:text-5xl font-bold text-white tracking-tight mb-3 text-balance">
                        {slide.title}
                      </h3>
                      <p className="text-base lg:text-xl text-white/85 leading-relaxed max-w-xl">
                        {slide.subtitle}
                      </p>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  FEATURES                                                */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="features" className="py-24 lg:py-32 bg-ink-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-16" data-aos="fade-up">
            <p className="title-accent text-sm font-bold text-gold-600 uppercase tracking-widest mb-4">
              Six tools, one protocol
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950 mb-4 text-balance">
              Saving, secured. Yield, optimized. Trust, built in.
            </h2>
            <p className="text-lg text-ink-600 leading-relaxed">
              StashPot bundles prize draws, inheritance, escrow, group savings, microloans, and local fiat on ramps into one cohesive protocol. Each feature stands on its own. Together, they cover the full savings journey.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={Trophy}
              title="Prize Pools"
              desc="Save your money in a pool. Every day, every week, and every month, one lucky saver wins. Your savings never decrease, only the bonus prizes change hands."
              image={IMG.features.pools}
              delay={0}
            />
            <FeatureCard
              icon={Lock}
              title="TimeLockr"
              desc="Two uses, one vault. Set up an inheritance fallback for your family, or hold funds in escrow between two parties until conditions are met. Time based, trustless, and cancellable."
              image={IMG.features.vaults}
              delay={100}
            />
            <FeatureCard
              icon={Users}
              title="Savings Circles"
              desc="The classic group savings, now on chain. Save together with friends, or join an open circle from anywhere in the world. Everyone gets their turn to receive."
              image={IMG.features.circles}
              delay={200}
            />
            <FeatureCard
              icon={HandCoins}
              title="Microloans"
              desc="Borrow against your saving history. The longer and steadier you save, the better your loan terms. Four levels, from fully backed to score only."
              image={IMG.features.loans}
              delay={300}
            />
            <FeatureCard
              icon={Banknote}
              title="Local Money On Ramps"
              desc="Top up in Naira, Cedi, Shilling, or Rand through Yellow Card or Transak. No swaps, no bridges, no headaches. Just deposit and start saving."
              image={IMG.features.fiat}
              delay={400}
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Fair Draws"
              desc="Every winner is chosen by a public formula. Anyone can rerun the math from on chain data and confirm the result. No hidden picks, ever."
              image={IMG.features.verify}
              delay={500}
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  HOW IT WORKS                                            */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="how" className="py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-20" data-aos="fade-up">
            <p className="title-accent text-sm font-bold text-gold-600 uppercase tracking-widest mb-4">
              How it works
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950 mb-4 text-balance">
              Four steps. Zero compromises.
            </h2>
            <p className="text-lg text-ink-600 leading-relaxed">
              No hidden fees. No long lockups. No fine print. The protocol takes deposits, generates yield, and routes that yield into prize pools. You stay in control of your principal at all times.
            </p>
          </div>

          <div className="space-y-24 lg:space-y-32">
            <Step
              num="01"
              title="Deposit"
              desc="Connect Phantom or Solflare. Or fund directly from local currency through Yellow Card or Transak. Funds settle into a non custodial Solana vault that only your wallet can withdraw from."
              image={IMG.steps.deposit}
              imageRight={false}
              icon={Banknote}
              delay={0}
            />
            <Step
              num="02"
              title="Yield generates"
              desc="Deposits are routed across Kamino, Save, Marginfi, and Drift. Current blended APY is approximately 8.74 percent, automatically rebalanced for risk adjusted return."
              image={IMG.steps.yield}
              imageRight={true}
              icon={TrendingUp}
              delay={100}
            />
            <Step
              num="03"
              title="Yield funds the prizes"
              desc="The aggregated yield is split into daily, weekly, and monthly prize pools. Winners are selected via Switchboard VRF using a Merkle root of time weighted balances. Public, deterministic, and reproducible."
              image={IMG.steps.prize}
              imageRight={false}
              icon={Trophy}
              delay={200}
            />
            <Step
              num="04"
              title="Withdraw"
              desc="No lockups. Pull your full principal at any time. Early withdrawals only reduce your weight in the next draw cycle. Your funds are never penalized."
              image={IMG.steps.withdraw}
              imageRight={true}
              icon={Zap}
              delay={300}
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  SECURITY / TRUST                                        */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="security" className="py-24 lg:py-32 bg-ink-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-[0.06]" />

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mb-16" data-aos="fade-up">
            <p className="text-sm font-bold text-gold-400 uppercase tracking-widest mb-4">
              <span className="inline-block w-6 h-0.5 bg-gold-400 mr-3 align-middle rounded-full" />
              Security at the core
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 mb-4 text-balance">
              Verifiable on chain.<br />Always recoverable.
            </h2>
            <p className="text-lg text-ink-300 leading-relaxed">
              Every state change, every winner, and every prize allocation is written to Solana and externally anchored. The protocol cannot move your funds, freeze them, or hide its operations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TrustCard
              image={IMG.trust.security}
              title="Non custodial vaults"
              desc="Funds are held in audited Solana program derived addresses. Only your wallet signature can authorize a withdrawal."
              delay={0}
            />
            <TrustCard
              image={IMG.trust.blockchain}
              title="Tamper evident audit log"
              desc="Every operation appends to a hash chained log, anchored externally every six hours. The history cannot be edited or deleted."
              delay={100}
            />
            <TrustCard
              image={IMG.trust.africa}
              title="Built in Lagos. Available globally."
              desc="Local fiat on ramps for Naira, Cedi, Shilling, and Rand. Anyone with a Solana wallet can use the protocol from anywhere."
              delay={200}
            />
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  SECURITY BADGES + INTEGRATION PARTNERS                  */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMG.performance}
            alt="Trust infrastructure"
            className="w-full h-full object-cover opacity-[0.04]"
            loading="lazy"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10">
          {/* ── Security badges ──────────────────────────────────── */}
          <div className="max-w-3xl mb-16" data-aos="fade-up">
            <p className="title-accent text-sm font-bold text-gold-600 uppercase tracking-widest mb-4">
              Trust, verified
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950 text-balance">
              Don't take our word for it. Check it yourself.
            </h2>
            <p className="mt-4 text-lg text-ink-600 leading-relaxed">
              Every guarantee is backed by code you can read, math you can verify, and an audit trail you can replay.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-20">
            <BadgeCard
              icon={KeyRound}
              title="Non custodial"
              desc="Funds live in your own Solana PDA. The protocol cannot move them without your signature."
              delay={0}
            />
            <BadgeCard
              icon={Eye}
              title="Open source"
              desc="Every smart contract is published on chain and on GitHub. Audit it yourself or hire someone to."
              delay={80}
            />
            <BadgeCard
              icon={ShieldCheck}
              title="Verifiable randomness"
              desc="Switchboard VRF generates each draw. The output is deterministic and reproducible from public state."
              delay={160}
            />
            <BadgeCard
              icon={FileCheck2}
              title="Audit in progress"
              desc="An independent third party security review is scheduled before public mainnet launch."
              delay={240}
            />
          </div>

          {/* ── Partners / integrations ─────────────────────────── */}
          <div className="max-w-3xl mb-12" data-aos="fade-up">
            <p className="title-accent text-sm font-bold text-gold-600 uppercase tracking-widest mb-4">
              Integrations
            </p>
            <h3 className="text-3xl lg:text-4xl font-bold tracking-tighter-2 text-ink-950 text-balance">
              Built on infrastructure that already works.
            </h3>
            <p className="mt-3 text-lg text-ink-600 leading-relaxed">
              StashPot integrates with established protocols and providers across the Solana DeFi and African fintech stacks. No untested dependencies.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4" data-aos="fade-up" data-aos-delay="100">
            {INTEGRATIONS.map((p, i) => (
              <PartnerLogoCard key={i} name={p.name} category={p.category} />
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  FAQ                                                     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="faq" className="py-24 lg:py-32 bg-ink-50">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-16" data-aos="fade-up">
            <p className="text-sm font-bold text-gold-600 uppercase tracking-widest mb-4">
              Common questions
            </p>
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tighter-2 text-ink-950 text-balance">
              Questions, answered.
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((f, i) => (
              <details
                key={i}
                className="group bg-white border border-ink-200 rounded-2xl overflow-hidden hover:border-royal-300 transition-colors"
                data-aos="fade-up"
                data-aos-delay={i * 50}
              >
                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                  <span className="font-semibold text-ink-900 text-lg pr-4">{f.q}</span>
                  <ChevronRight
                    size={20}
                    className="text-royal-600 group-open:rotate-90 transition-transform flex-shrink-0"
                  />
                </summary>
                <div className="px-6 pb-6 text-ink-600 leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/*  CTA                                                     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={IMG.cta}
            alt="People celebrating their savings"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-royal-950/95 via-royal-900/85 to-royal-800/70" />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 text-center">
          <Sparkles size={40} className="text-gold-400 mx-auto mb-6" data-aos="zoom-in" />
          <h2
            className="text-4xl lg:text-6xl font-bold tracking-tighter-2 text-white mb-6 text-balance"
            data-aos="fade-up"
          >
            Start with what you have.
          </h2>
          <p
            className="text-lg lg:text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed"
            data-aos="fade-up"
            data-aos-delay="100"
          >
            Sign in with your email or connect a Solana wallet. Deposit any amount of USDC. Earn yield from day one and enter the next prize draw automatically. No minimums, no commitments.
          </p>
          <div className="flex flex-wrap gap-3 justify-center" data-aos="fade-up" data-aos-delay="200">
            <button
              onClick={() => signIn()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-royal-800 text-sm font-bold hover:bg-gold-100 transition-all shadow-soft-lg"
            >
              <Mail size={16} />
              Get started
              <ArrowRight size={14} />
            </button>
            <Link
              to="/verify"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white/10 backdrop-blur-md border border-white/30 text-sm font-semibold text-white hover:bg-white/20 transition-all"
            >
              Check a draw <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// ─── Sub-components ──────────────────────────────────────────────

const FeatureCard: FC<{
  icon: any; title: string; desc: string; image: string; delay: number
}> = ({ icon: Icon, title, desc, image, delay }) => (
  <div
    className="group bg-white rounded-2xl border border-ink-200 overflow-hidden hover-lift"
    data-aos="fade-up"
    data-aos-delay={delay}
  >
    <div className="relative aspect-[16/10] overflow-hidden img-zoom">
      <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
      <div className="absolute top-4 left-4 w-11 h-11 rounded-xl bg-white/95 backdrop-blur-md flex items-center justify-center shadow-soft">
        <Icon size={20} className="text-royal-600" />
      </div>
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-ink-900 mb-2 tracking-tight">{title}</h3>
      <p className="text-ink-600 leading-relaxed text-[15px]">{desc}</p>
    </div>
  </div>
)

const Step: FC<{
  num: string; title: string; desc: string; image: string;
  imageRight: boolean; icon: any; delay: number
}> = ({ num, title, desc, image, imageRight, icon: Icon, delay }) => (
  <div
    className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center ${
      imageRight ? '' : 'lg:[&>*:first-child]:order-2'
    }`}
    data-aos="fade-up"
    data-aos-delay={delay}
  >
    <div className="img-ring img-zoom aspect-[4/3]">
      <img src={image} alt={title} className="w-full h-full object-cover" loading="lazy" />
    </div>
    <div>
      <div className="flex items-center gap-4 mb-6">
        <span className="text-6xl font-bold text-royal-100 tabular leading-none">{num}</span>
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-royal-50 to-gold-50 border border-royal-100 flex items-center justify-center">
          <Icon size={22} className="text-royal-600" />
        </div>
      </div>
      <h3 className="text-3xl lg:text-4xl font-bold text-ink-950 tracking-tight mb-4 text-balance">
        {title}
      </h3>
      <p className="text-lg text-ink-600 leading-relaxed">{desc}</p>
    </div>
  </div>
)

const TrustCard: FC<{ image: string; title: string; desc: string; delay: number }> = ({
  image, title, desc, delay,
}) => (
  <div
    className="bg-ink-900 border border-ink-800 rounded-2xl overflow-hidden hover:border-royal-700 transition-all group"
    data-aos="fade-up"
    data-aos-delay={delay}
  >
    <div className="relative aspect-[16/10] overflow-hidden">
      <img
        src={image}
        alt={title}
        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/30 to-transparent" />
    </div>
    <div className="p-6">
      <h3 className="text-xl font-bold text-white mb-2 tracking-tight">{title}</h3>
      <p className="text-ink-400 leading-relaxed text-[15px]">{desc}</p>
    </div>
  </div>
)

const BadgeCard: FC<{ icon: any; title: string; desc: string; delay: number }> = ({
  icon: Icon, title, desc, delay,
}) => (
  <div
    className="bg-white rounded-2xl border border-ink-200 p-6 hover-lift relative overflow-hidden"
    data-aos="fade-up"
    data-aos-delay={delay}
  >
    {/* Subtle gold corner accent */}
    <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br from-gold-100 to-transparent opacity-60" />

    <div className="relative">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-royal-600 to-royal-800 flex items-center justify-center mb-4 shadow-royal">
        <Icon size={20} className="text-white" />
      </div>
      <h3 className="text-base font-bold text-ink-950 mb-2 tracking-tight">{title}</h3>
      <p className="text-sm text-ink-600 leading-relaxed">{desc}</p>
    </div>
  </div>
)

const PartnerLogoCard: FC<{ name: string; category: string }> = ({ name, category }) => {
  const LogoComp = PARTNER_MARKS[name]
  return (
    <div className="bg-white rounded-2xl border border-ink-200 p-6 hover-lift flex flex-col items-center justify-center text-center min-h-[140px] group">
      <div className="h-10 mb-3 flex items-center justify-center text-ink-700 group-hover:text-royal-700 transition-colors">
        {LogoComp ? <LogoComp className="h-10 w-auto" /> : <span className="text-lg font-bold">{name}</span>}
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 mt-1">{category}</p>
    </div>
  )
}

// ─── Integration partners ────────────────────────────────────────
const INTEGRATIONS = [
  { name: 'Solana',       category: 'Blockchain' },
  { name: 'Kamino',       category: 'Yield' },
  { name: 'Marginfi',     category: 'Yield' },
  { name: 'Drift',        category: 'Yield' },
  { name: 'Save Protocol',category: 'Yield' },
  { name: 'Switchboard',  category: 'Randomness' },
  { name: 'Yellow Card',  category: 'On Ramp' },
  { name: 'Transak',      category: 'On Ramp' },
  { name: 'Phantom',      category: 'Wallet' },
  { name: 'Solflare',     category: 'Wallet' },
  { name: 'Anchor',       category: 'Framework' },
  { name: 'Pyth',         category: 'Oracle' },
]

// ─── FAQs (clear, professional, no hyphens) ──────────────────────
const FAQS = [
  {
    q: 'Can I lose my deposit?',
    a: 'No. Your principal is held in audited Solana program derived addresses. Only the yield those funds generate enters the prize draws. Your deposit can be withdrawn in full at any time.',
  },
  {
    q: 'How are winners selected?',
    a: 'Each draw uses Switchboard VRF, a verifiable random function on Solana, combined with a Merkle root of all participants weighted by time and balance. The result is fully deterministic and reproducible from public on chain data.',
  },
  {
    q: 'Where does the yield come from?',
    a: 'Deposits are routed across Kamino Finance, Save Protocol, Marginfi, and Drift Protocol. The blended return currently sits around 8.74 percent APY and is rebalanced automatically for risk adjusted yield.',
  },
  {
    q: 'Can I use TimeLockr as escrow between two parties?',
    a: 'Yes. TimeLockr supports two configurations. The first is inheritance, where beneficiaries claim funds after a chosen period of inactivity. The second is escrow, where funds are held until both parties agree, a deadline expires, or a defined condition is met. The same vault primitive powers both.',
  },
  {
    q: 'Do I need to live in Africa to use this?',
    a: 'No. The local fiat on ramps focus on Naira, Cedi, Shilling, and Rand. But anyone with a Solana wallet and USDC can use the protocol from anywhere in the world.',
  },
  {
    q: 'What happens if I withdraw early?',
    a: 'There is no penalty on your principal. Withdrawals within 24 hours of deposit reduce your weight in the next draw cycle only. Your full balance is always available.',
  },
  {
    q: 'How is this different from a traditional lottery?',
    a: 'A traditional lottery takes your money permanently. StashPot does not. You always retain your full principal. Prizes are funded entirely by the DeFi yield your deposit generates, never by the deposit itself.',
  },
  {
    q: 'Once a TimeLockr vault is claimed, can it be reused?',
    a: 'No. A claimed TimeLockr vault is closed permanently. Funds entering your wallet afterwards are separate and unaffected. To protect new deposits, create a new vault.',
  },
]

export default Landing
