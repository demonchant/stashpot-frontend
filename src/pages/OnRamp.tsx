content = '''export default function OnRamp() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Fiat On-Ramp</h1>
        <p className="text-lg text-gray-600">
          Convert local currency to USDC and fund your StashPot wallet
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-3">🌍 African Markets</h3>
          <p className="text-gray-600 mb-4">
            Direct conversion from local currencies using mobile money and bank transfers
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>🇳🇬 Nigerian Naira (NGN)</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
            <div className="flex justify-between">
              <span>🇰🇪 Kenyan Shilling (KES)</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
            <div className="flex justify-between">
              <span>🇬🇭 Ghanaian Cedi (GHS)</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
            <div className="flex justify-between">
              <span>🇿🇦 South African Rand (ZAR)</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border-2 border-gray-200">
          <h3 className="text-xl font-bold mb-3">💳 Global Payments</h3>
          <p className="text-gray-600 mb-4">
            Buy crypto with credit/debit cards from anywhere in the world
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Credit Card</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
            <div className="flex justify-between">
              <span>Debit Card</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
            <div className="flex justify-between">
              <span>Apple Pay</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
            <div className="flex justify-between">
              <span>Google Pay</span>
              <span className="text-green-600">✓ Supported</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-royal-50 to-accent-50 p-8 rounded-xl text-center">
        <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
        <p className="text-gray-700 mb-6">
          We're integrating with Bridge, Coinbase Onramp, Yellow Card, and Transak to bring you the best on-ramp experience.
        </p>
        <div className="inline-flex gap-4">
          <div className="px-6 py-3 bg-white rounded-lg shadow-sm">
            <span className="text-sm text-gray-600">Powered by</span>
            <div className="font-bold mt-1">Bridge + Yellow Card</div>
          </div>
        </div>
      </div>

      <div className="mt-12 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-bold mb-2">📱 For Demo Purposes</h3>
        <p className="text-sm text-gray-700">
          This hackathon demo uses Solana devnet. To get test USDC for deposits, visit faucet.circle.com and select Solana Devnet.
        </p>
      </div>
    </div>
  )
}
'''

with open('src/pages/OnRamp.tsx', 'w') as f:
    f.write(content)
    
print("OnRamp.tsx created successfully!")
