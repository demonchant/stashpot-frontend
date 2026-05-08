import { FC } from 'react'
import { ExternalLink } from 'lucide-react'

const OnRamp: FC = () => {
  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Buy USDC</h1>
      
      <div className="grid md:grid-cols-2 gap-4">
        
          href="https://www.yellowcard.io"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 border border-ink-200 rounded-lg hover:border-royal-400 transition"
        >
          <h3 className="font-bold text-lg mb-2">Yellow Card</h3>
          <p className="text-sm text-ink-600 mb-4">Buy with NGN, KES, GHS, ZAR</p>
          <ExternalLink size={16} className="text-royal-600" />
        </a>
        
        
          href="https://global.transak.com"
          target="_blank"
          rel="noopener noreferrer"
          className="p-6 border border-ink-200 rounded-lg hover:border-royal-400 transition"
        >
          <h3 className="font-bold text-lg mb-2">Transak</h3>
          <p className="text-sm text-ink-600 mb-4">Buy with card or bank transfer</p>
          <ExternalLink size={16} className="text-royal-600" />
        </a>
      </div>
    </div>
  )
}

export default OnRamp
