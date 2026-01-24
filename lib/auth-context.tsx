'use client'

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, PortfolioStock } from './types'
import { mockStocks } from './mock-data'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string, name: string) => Promise<boolean>
  logout: () => void
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
    const savedUser = localStorage.getItem('dividend_user')
    const savedPortfolio = localStorage.getItem('dividend_portfolio')
    
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedPortfolio) {
      setPortfolio(JSON.parse(savedPortfolio))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('dividend_users') || '[]')
    const foundUser = users.find((u: { email: string; password: string }) => 
      u.email === email && u.password === password
    )
    
    if (foundUser) {
      const { password: _, ...userWithoutPassword } = foundUser
      setUser(userWithoutPassword)
      localStorage.setItem('dividend_user', JSON.stringify(userWithoutPassword))
      
      const userPortfolio = localStorage.getItem(`dividend_portfolio_${foundUser.id}`)
      if (userPortfolio) {
        setPortfolio(JSON.parse(userPortfolio))
        localStorage.setItem('dividend_portfolio', userPortfolio)
      }
      return true
    }
    return false
  }

  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    const users = JSON.parse(localStorage.getItem('dividend_users') || '[]')
    
    if (users.some((u: { email: string }) => u.email === email)) {
      return false
    }
    
    const newUser = {
      id: crypto.randomUUID(),
      email,
      password,
      name,
      createdAt: new Date(),
    }
    
    users.push(newUser)
    localStorage.setItem('dividend_users', JSON.stringify(users))
    
    const { password: _, ...userWithoutPassword } = newUser
    setUser(userWithoutPassword)
    localStorage.setItem('dividend_user', JSON.stringify(userWithoutPassword))
    
    return true
  }

  const logout = () => {
    if (user) {
      localStorage.setItem(`dividend_portfolio_${user.id}`, JSON.stringify(portfolio))
    }
    setUser(null)
    setPortfolio([])
    localStorage.removeItem('dividend_user')
    localStorage.removeItem('dividend_portfolio')
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
    localStorage.setItem('dividend_portfolio', JSON.stringify(newPortfolio))
    if (user) {
      localStorage.setItem(`dividend_portfolio_${user.id}`, JSON.stringify(newPortfolio))
    }
  }

  const removeFromPortfolio = (symbol: string) => {
    const newPortfolio = portfolio.filter(p => p.symbol !== symbol)
    setPortfolio(newPortfolio)
    localStorage.setItem('dividend_portfolio', JSON.stringify(newPortfolio))
    if (user) {
      localStorage.setItem(`dividend_portfolio_${user.id}`, JSON.stringify(newPortfolio))
    }
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      isLoading, 
      login, 
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
