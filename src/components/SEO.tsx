import { FC } from 'react'
import { Helmet } from 'react-helmet-async'

interface SEOProps {
  title?: string
  description?: string
  image?: string
  canonical?: string
}

const DEFAULT_TITLE = 'StashPot — Personal USDC Wallet on Solana Mainnet'
const DEFAULT_DESC =
  'Track, receive, and swap to native USDC in your own self-custodial Solana mainnet wallet.'
const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=630&fit=crop&q=80'

export const SEO: FC<SEOProps> = ({ title, description, image, canonical }) => {
  const fullTitle = title ? `${title} — StashPot` : DEFAULT_TITLE
  const desc = description || DEFAULT_DESC
  const img = image || DEFAULT_IMAGE
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:image" content={img} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
    </Helmet>
  )
}
