'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, PortfolioStock } from './types'
import { mockStocks } from './mock-data'
import { supabase } from './supabase-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

interface AuthResult {
  success: boolean
  message?: string
  needsEmailConfirmation?: boolean
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  loginWithGoogle: () => Promise<AuthResult>
  register: (email: string, password: string, name: string) => Promise<AuthResult>
  logout: () => Promise<void>
  portfolio: PortfolioStock[]
  addToPortfolio: (symbol: string, shares: number, averageCost: number) => void
  removeFromPortfolio: (symbol: string) => void
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([])

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      const mappedUser = mapUser(data.session?.user ?? null)
      setUser(mappedUser)
      loadPortfolioForUser(mappedUser)
      setIsLoading(false)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const mappedUser = mapUser(session?.user ?? null)
      setUser(mappedUser)
      loadPortfolioForUser(mappedUser)
    })

    loadSession()

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session?.user) {
      return { success: false, message: error?.message ?? '이메일 또는 비밀번호가 올바르지 않습니다.' }
    }

    const mappedUser = mapUser(data.session.user)
    setUser(mappedUser)
    loadPortfolioForUser(mappedUser)
    return { success: true }
  }

  const loginWithGoogle = async (): Promise<AuthResult> => {
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/dashboard`
      : undefined

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    })

    if (error) {
      return { success: false, message: error.message }
    }

    return { success: true }
  }

  const register = async (email: string, password: string, name: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
      },
    })

    if (error) {
      return { success: false, message: error.message }
    }

    if (!data.session?.user) {
      return { success: true, needsEmailConfirmation: true }
    }

    const mappedUser = mapUser(data.session.user)
    setUser(mappedUser)
    loadPortfolioForUser(mappedUser)
    return { success: true }
  }

  const logout = async () => {
    if (user) {
      localStorage.setItem(`dividend_portfolio_${user.id}`, JSON.stringify(portfolio))
    }
    setUser(null)
    setPortfolio([])
    await supabase.auth.signOut()
  }

  const mapUser = (supabaseUser: SupabaseUser | null): User | null => {
    if (!supabaseUser) return null
    const name =
      (supabaseUser.user_metadata?.name as string | undefined) ??
      supabaseUser.email?.split('@')[0] ??
      '회원'

    return {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      name,
      createdAt: new Date(supabaseUser.created_at ?? new Date().toISOString()),
    }
  }

  const loadPortfolioForUser = (nextUser: User | null) => {
    if (!nextUser) {
      setPortfolio([])
      return
    }

    const savedPortfolio = localStorage.getItem(`dividend_portfolio_${nextUser.id}`)
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio))
    } else {
      setPortfolio([])
    }
  }

  const addToPortfolio = (symbol: string, shares: number, averageCost: number) => {
    const stockData = mockStocks.find(s => s.symbol === symbol)
    if (!stockData) return

    const existingIndex = portfolio.findIndex(p => p.symbol === symbol)
    
    let newPortfolio: PortfolioStock[]
    
    if (existingIndex >= 0) {
      newPortfolio = [...portfolio]
      const existing = newPortfolio[existingIndex]
      const totalShares = existing.shares + shares
      const newAvgCost = ((existing.shares * existing.averageCost) + (shares * averageCost)) / totalShares
      
      newPortfolio[existingIndex] = {
        ...existing,
        shares: totalShares,
        averageCost: newAvgCost,
        totalValue: totalShares * stockData.currentPrice,
        totalDividend: totalShares * stockData.annualDividend,
      }
    } else {
      const newStock: PortfolioStock = {
        ...stockData,
        shares,
        averageCost,
        totalValue: shares * stockData.currentPrice,
        totalDividend: shares * stockData.annualDividend,
        addedAt: new Date(),
      }
      newPortfolio = [...portfolio, newStock]
    }
    
    setPortfolio(newPortfolio)
    if (user) {
      localStorage.setItem(`dividend_portfolio_${user.id}`, JSON.stringify(newPortfolio))
    }
  }

  const removeFromPortfolio = (symbol: string) => {
    const newPortfolio = portfolio.filter(p => p.symbol !== symbol)
    setPortfolio(newPortfolio)
    if (user) {
      localStorage.setItem(`dividend_portfolio_${user.id}`, JSON.stringify(newPortfolio))
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
      loginWithGoogle,
      register, 
      logout, 
      portfolio, 
      addToPortfolio, 
      removeFromPortfolio 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
