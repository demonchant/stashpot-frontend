import axios, { AxiosInstance } from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

class ApiClient {
  private client: AxiosInstance
  private token: string | null = null

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: { 'Content-Type': 'application/json' },
    })

    this.token = localStorage.getItem('stashpot_token')

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`
      }
      const idem = config.headers['Idempotency-Key']
      if (!idem && ['post', 'put', 'patch'].includes(config.method || '')) {
        config.headers['Idempotency-Key'] = crypto.randomUUID()
      }
      return config
    })

    this.client.interceptors.response.use(
      (r) => r,
      (e) => {
        if (e.response?.status === 401) {
          this.clearToken()
          window.dispatchEvent(new CustomEvent('auth:logout'))
        }
        return Promise.reject(e)
      }
    )
  }

  setToken(t: string) {
    this.token = t
    localStorage.setItem('stashpot_token', t)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('stashpot_token')
  }

  // Auth
  async getNonce(wallet: string) {
    return (await this.client.get(`/api/auth/nonce/${wallet}`)).data
  }
  
  async verifySignature(wallet: string, signature: string, nonce: string) {
    return (await this.client.post('/api/auth/verify', { wallet, signature, nonce })).data
  }
  
  async verifyPrivy(idToken: string, walletAddress?: string) {
    return (await this.client.post('/api/auth/privy/verify', { walletAddress }, {
      headers: { 'Authorization': `Bearer ${idToken}` }
    })).data
  }

  // User
  async getMe() { return (await this.client.get('/api/users/me')).data }
  async updateMe(data: any) { return (await this.client.patch('/api/users/me', data)).data }
  async getHistory() { return (await this.client.get('/api/users/history')).data }

  // Pools
  async getPools() { return (await this.client.get('/api/pools')).data }
  async getMyOdds() { return (await this.client.get('/api/pools/my-odds')).data }
  async deposit(poolId: string, amount: number) {
    return (await this.client.post('/api/pools/deposit', { poolId, amount })).data
  }
  async withdraw(poolId: string, amount: number) {
    return (await this.client.post('/api/pools/withdraw', { poolId, amount })).data
  }
  async getPoolHistory() { return (await this.client.get('/api/pools/history')).data }

  // Vaults
  async getVaults() { return (await this.client.get('/api/vaults')).data }
  async createVault(data: any) { return (await this.client.post('/api/vaults', data)).data }
  async pingVault(id: string) { return (await this.client.post(`/api/vaults/${id}/ping`)).data }
  async cancelVault(id: string) { return (await this.client.delete(`/api/vaults/${id}`)).data }

  // Circles
  async getCircles() { return (await this.client.get('/api/circles')).data }
  async getPublicCircles() { return (await this.client.get('/api/circles/public')).data }
  async createCircle(data: any) { return (await this.client.post('/api/circles', data)).data }
  async joinCircle(id: string) { return (await this.client.post(`/api/circles/${id}/join`)).data }
  async contributeCircle(id: string, amount: number) {
    return (await this.client.post(`/api/circles/${id}/contribute`, { amount })).data
  }

  // Loans
  async getEligibleLoans() { return (await this.client.get('/api/loans/eligible')).data }
  async getMyLoans() { return (await this.client.get('/api/loans/mine')).data }
  async requestLoan(data: any) { return (await this.client.post('/api/loans/request', data)).data }
  async repayLoan(id: string, amount: number) {
    return (await this.client.post(`/api/loans/${id}/repay`, { amount })).data
  }

  // Fiat
  async getFiatRates() { return (await this.client.get('/api/fiat/rates')).data }
  async initiateFiatDeposit(data: any) {
    return (await this.client.post('/api/fiat/deposit/initiate', data)).data
  }
  async mockConfirmFiat(reference: string) {
    return (await this.client.post('/api/fiat/deposit/mock-confirm', { reference })).data
  }
  async getFiatHistory() { return (await this.client.get('/api/fiat/history')).data }

  // Referrals
  async getReferralStats() { return (await this.client.get('/api/referrals/stats')).data }
  async generateReferralCode() { return (await this.client.post('/api/referrals/generate')).data }
  async registerReferral(code: string) {
    return (await this.client.post('/api/referrals/register', { code })).data
  }
  async getReferralLeaderboard() { return (await this.client.get('/api/referrals/leaderboard')).data }

  // Public Stats
  async getProtocolInfo() { return (await this.client.get('/api/stats/protocol-info')).data }
  async getYields() { return (await this.client.get('/api/stats/yields/current')).data }

  // Verify
  async verifyRound(roundId: string, poolType: string) {
    return (await this.client.get(`/api/verify/round/${roundId}?pool_type=${poolType}`)).data
  }
  async getWeights(poolType: string) {
    return (await this.client.get(`/api/verify/weights/${poolType}`)).data
  }
  async getOdds(wallet: string) {
    return (await this.client.get(`/api/verify/odds/${wallet}`)).data
  }
}

export const api = new ApiClient()
