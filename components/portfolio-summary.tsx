'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, DollarSign, Calendar, Percent } from 'lucide-react'

export function PortfolioSummary() {
  const { portfolio } = useAuth()

  const totalValue = portfolio.reduce((sum, stock) => sum + stock.totalValue, 0)
  const totalDividend = portfolio.reduce((sum, stock) => sum + stock.totalDividend, 0)
  const avgYield = totalValue > 0 ? (totalDividend / totalValue) * 100 : 0
  const totalCost = portfolio.reduce((sum, stock) => sum + stock.shares * stock.averageCost, 0)
  const totalReturn = totalValue - totalCost
  const returnPercent = totalCost > 0 ? (totalReturn / totalCost) * 100 : 0

  const summaryCards = [
    {
      title: '총 평가금액',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: totalReturn >= 0 ? `+$${totalReturn.toFixed(2)}` : `-$${Math.abs(totalReturn).toFixed(2)}`,
      subColor: totalReturn >= 0 ? 'text-success' : 'text-destructive',
      icon: DollarSign,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '예상 연간 배당금',
      value: `$${totalDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: `월 $${(totalDividend / 12).toFixed(2)}`,
      subColor: 'text-muted-foreground',
      icon: Calendar,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: '평균 배당수익률',
      value: `${avgYield.toFixed(2)}%`,
      subValue: portfolio.length > 0 ? `${portfolio.length}개 종목` : '종목 없음',
      subColor: 'text-muted-foreground',
      icon: Percent,
      bgColor: 'bg-chart-4/10',
      iconColor: 'text-chart-4',
    },
    {
      title: '총 수익률',
      value: `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(2)}%`,
      subValue: `투자원금 $${totalCost.toFixed(2)}`,
      subColor: 'text-muted-foreground',
      icon: TrendingUp,
      bgColor: returnPercent >= 0 ? 'bg-success/10' : 'bg-destructive/10',
      iconColor: returnPercent >= 0 ? 'text-success' : 'text-destructive',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {summaryCards.map((card) => (
        <Card key={card.title} className="border-border bg-card">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{card.value}</p>
                <p className={`mt-1 text-sm ${card.subColor}`}>{card.subValue}</p>
              </div>
              <div className={`rounded-xl p-3 ${card.bgColor}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
