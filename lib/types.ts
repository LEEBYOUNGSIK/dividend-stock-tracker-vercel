export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
}

export interface DividendStock {
  id: string
  symbol: string
  name: string
  currentPrice: number
  dividendYield: number
  annualDividend: number
  quarterlyDividend: number
  exDividendDate: string
  paymentDate: string
  payoutRatio: number
  dividendGrowthRate: number
  sector: string
  marketCap: string
  peRatio: number
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
}

export interface DividendHistory {
  year: number
  quarter?: string
  amount: number
  exDate: string
  payDate: string
  changePercent: number
  isCut: boolean
}

export interface CalendarEvent {
  date: string
  type: 'ex-dividend' | 'payment'
  stocks: {
    symbol: string
    name: string
    amount: number
  }[]
}

export interface PortfolioStock extends DividendStock {
  shares: number
  averageCost: number
  totalValue: number
  totalDividend: number
  addedAt: Date
}
