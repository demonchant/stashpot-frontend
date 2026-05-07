import { create } from 'zustand'

interface User {
  id: string
  wallet: string
  username?: string
  email?: string
  usdc?: string
  composite?: number
  tier?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (token: string, user: User) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('stashpot_token'),
  isAuthenticated: !!localStorage.getItem('stashpot_token'),
  setAuth: (token, user) => {
    localStorage.setItem('stashpot_token', token)
    set({ token, user, isAuthenticated: true })
  },
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('stashpot_token')
    set({ token: null, user: null, isAuthenticated: false })
  },
}))
