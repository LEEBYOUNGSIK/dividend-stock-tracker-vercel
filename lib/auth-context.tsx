'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, PortfolioStock, DividendStock } from './types'
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
  addToPortfolio: (stock: DividendStock, shares: number, averageCost: number) => Promise<void>
  removeFromPortfolio: (symbol: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [portfolio, setPortfolio] = useState<PortfolioStock[]>([])
  const portfolioTable = 'portfolio_stocks'

  useEffect(() => {
    let isMounted = true

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (!isMounted) return
      const mappedUser = mapUser(data.session?.user ?? null)
      setUser(mappedUser)
      await loadPortfolioForUser(mappedUser)
      setIsLoading(false)
    }

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const mappedUser = mapUser(session?.user ?? null)
      setUser(mappedUser)
      await loadPortfolioForUser(mappedUser)
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
    await loadPortfolioForUser(mappedUser)
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
    await loadPortfolioForUser(mappedUser)
    return { success: true }
  }

  const logout = async () => {
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

  const buildPortfolioStock = (row: any): PortfolioStock => {
    const currentPrice = Number(row.current_price ?? 0)
    const annualDividend = Number(row.annual_dividend ?? 0)
    const shares = Number(row.shares ?? 0)

    return {
      id: row.id,
      symbol: row.symbol ?? '',
      name: row.name ?? row.symbol ?? '',
      currentPrice,
      dividendYield: Number(row.dividend_yield ?? 0),
      annualDividend,
      quarterlyDividend: Number(row.quarterly_dividend ?? 0),
      exDividendDate: row.ex_dividend_date ?? '',
      paymentDate: row.payment_date ?? '',
      payoutRatio: Number(row.payout_ratio ?? 0),
      dividendGrowthRate: Number(row.dividend_growth_rate ?? 0),
      sector: row.sector ?? '기타',
      marketCap: row.market_cap ?? '',
      peRatio: Number(row.pe_ratio ?? 0),
      fiftyTwoWeekHigh: Number(row.fifty_two_week_high ?? 0),
      fiftyTwoWeekLow: Number(row.fifty_two_week_low ?? 0),
      shares,
      averageCost: Number(row.average_cost ?? 0),
      totalValue: shares * currentPrice,
      totalDividend: shares * annualDividend,
      addedAt: row.added_at ? new Date(row.added_at) : new Date(),
    }
  }

  const refreshPortfolioGrowthRates = async (currentPortfolio: PortfolioStock[]) => {
    const targets = currentPortfolio.filter(
      (stock) => stock.dividendGrowthRate === 0 && stock.symbol,
    )

    if (targets.length === 0) {
      return
    }

    const updates = await Promise.all(
      targets.map(async (stock) => {
        try {
          const response = await fetch(`/api/yahoo/stock?symbol=${encodeURIComponent(stock.symbol)}`)
          if (!response.ok) return null
          const data = await response.json()
          const nextRate = Number(data?.stock?.dividendGrowthRate)
          if (!Number.isFinite(nextRate) || nextRate === 0) return null
          return { id: stock.id, symbol: stock.symbol, dividendGrowthRate: nextRate }
        } catch {
          return null
        }
      }),
    )

    const validUpdates = updates.filter((update): update is { id: string; symbol: string; dividendGrowthRate: number } => Boolean(update))

    if (validUpdates.length === 0) {
      return
    }

    await Promise.all(
      validUpdates.map((update) =>
        supabase
          .from(portfolioTable)
          .update({ dividend_growth_rate: update.dividendGrowthRate })
          .eq('id', update.id),
      ),
    )

    setPortfolio((prev) =>
      prev.map((stock) => {
        const match = validUpdates.find((update) => update.id === stock.id)
        return match ? { ...stock, dividendGrowthRate: match.dividendGrowthRate } : stock
      }),
    )
  }

  const loadPortfolioForUser = async (nextUser: User | null) => {
    if (!nextUser) {
      setPortfolio([])
      return
    }

    const { data, error } = await supabase
      .from(portfolioTable)
      .select('*')
      .eq('user_id', nextUser.id)
      .order('added_at', { ascending: false })

    if (error) {
      console.error('포트폴리오 로드 실패:', error.message)
      setPortfolio([])
      return
    }

    const mappedPortfolio = (data ?? []).map(buildPortfolioStock)
    setPortfolio(mappedPortfolio)
    void refreshPortfolioGrowthRates(mappedPortfolio)
  }

  const addToPortfolio = async (stock: DividendStock, shares: number, averageCost: number) => {
    if (!user) return

    const { data: existing, error: existingError } = await supabase
      .from(portfolioTable)
      .select('*')
      .eq('user_id', user.id)
      .eq('symbol', stock.symbol)
      .maybeSingle()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('포트폴리오 확인 실패:', existingError.message)
      return
    }

    if (existing) {
      const totalShares = Number(existing.shares ?? 0) + shares
      const newAvgCost =
        totalShares > 0
          ? ((Number(existing.shares ?? 0) * Number(existing.average_cost ?? 0)) + (shares * averageCost)) / totalShares
          : averageCost

      const { error } = await supabase
        .from(portfolioTable)
        .update({
          name: stock.name,
          sector: stock.sector,
          current_price: stock.currentPrice,
          dividend_yield: stock.dividendYield,
          annual_dividend: stock.annualDividend,
          quarterly_dividend: stock.quarterlyDividend,
          ex_dividend_date: stock.exDividendDate,
          payment_date: stock.paymentDate,
          payout_ratio: stock.payoutRatio,
          dividend_growth_rate: stock.dividendGrowthRate,
          market_cap: stock.marketCap,
          pe_ratio: stock.peRatio,
          fifty_two_week_high: stock.fiftyTwoWeekHigh,
          fifty_two_week_low: stock.fiftyTwoWeekLow,
          shares: totalShares,
          average_cost: newAvgCost,
        })
        .eq('id', existing.id)

      if (error) {
        console.error('포트폴리오 업데이트 실패:', error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from(portfolioTable)
        .insert({
          user_id: user.id,
          symbol: stock.symbol,
          name: stock.name,
          sector: stock.sector,
          current_price: stock.currentPrice,
          dividend_yield: stock.dividendYield,
          annual_dividend: stock.annualDividend,
          quarterly_dividend: stock.quarterlyDividend,
          ex_dividend_date: stock.exDividendDate,
          payment_date: stock.paymentDate,
          payout_ratio: stock.payoutRatio,
          dividend_growth_rate: stock.dividendGrowthRate,
          market_cap: stock.marketCap,
          pe_ratio: stock.peRatio,
          fifty_two_week_high: stock.fiftyTwoWeekHigh,
          fifty_two_week_low: stock.fiftyTwoWeekLow,
          shares,
          average_cost: averageCost,
        })

      if (error) {
        console.error('포트폴리오 저장 실패:', error.message)
        return
      }
    }

    await loadPortfolioForUser(user)
  }

  const removeFromPortfolio = async (symbol: string) => {
    if (!user) return

    const { error } = await supabase
      .from(portfolioTable)
      .delete()
      .eq('user_id', user.id)
      .eq('symbol', symbol)

    if (error) {
      console.error('포트폴리오 삭제 실패:', error.message)
      return
    }

    await loadPortfolioForUser(user)
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
