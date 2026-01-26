'use client'

import { useAuth } from '@/lib/auth-context'
import { Card, CardContent } from '@/components/ui/card'
import { DollarSign, Calendar, Percent, TrendingUp, Layers } from 'lucide-react'

export function PortfolioSummary() {
  const { portfolio } = useAuth()

  const totalValue = portfolio.reduce((sum, stock) => sum + stock.totalValue, 0)
  const totalDividend = portfolio.reduce((sum, stock) => sum + stock.totalDividend, 0)
  const avgYield = totalValue > 0 ? (totalDividend / totalValue) * 100 : 0
  const monthlyDividend = totalDividend / 12
  const avgGrowthRate =
    portfolio.length > 0
      ? portfolio.reduce((sum, stock) => sum + (Number(stock.dividendGrowthRate) || 0), 0) /
        portfolio.length
      : 0
  const totalHoldings = portfolio.length
  const summaryCards = [
    {
      title: '총 평가금액',
      value: `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: totalHoldings > 0 ? `${totalHoldings}개 종목` : '종목 없음',
      subColor: 'text-muted-foreground',
      icon: DollarSign,
      bgColor: 'bg-primary/10',
      iconColor: 'text-primary',
    },
    {
      title: '예상 연간 배당금',
      value: `$${totalDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: `월 $${monthlyDividend.toFixed(2)}`,
      subColor: 'text-muted-foreground',
      icon: Calendar,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: '월 예상 배당금',
      value: `$${monthlyDividend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subValue: `연 $${totalDividend.toFixed(2)}`,
      subColor: 'text-muted-foreground',
      icon: Calendar,
      bgColor: 'bg-success/10',
      iconColor: 'text-success',
    },
    {
      title: '평균 배당수익률',
      value: `${avgYield.toFixed(2)}%`,
      subValue: totalHoldings > 0 ? `${totalHoldings}개 종목` : '종목 없음',
      subColor: 'text-muted-foreground',
      icon: Percent,
      bgColor: 'bg-chart-4/10',
      iconColor: 'text-chart-4',
    },
    {
      title: '배당 성장률 평균',
      value: `${avgGrowthRate.toFixed(2)}%`,
      subValue: totalHoldings > 0 ? `${totalHoldings}개 종목 평균` : '종목 없음',
      subColor: 'text-muted-foreground',
      icon: TrendingUp,
      bgColor: 'bg-secondary/60',
      iconColor: 'text-foreground',
    },
    {
      title: '총 보유 종목 수',
      value: `${totalHoldings}개`,
      subValue: totalHoldings > 0 ? '보유 중' : '종목 없음',
      subColor: 'text-muted-foreground',
      icon: Layers,
      bgColor: 'bg-muted',
      iconColor: 'text-foreground',
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
