'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { TrendingUp, TrendingDown, Calendar, Percent, DollarSign, PieChart, BarChart3 } from 'lucide-react'
import type { DividendStock } from '@/lib/types'

interface StockDetailCardProps {
  stock: DividendStock
}

export function StockDetailCard({ stock }: StockDetailCardProps) {
  const priceChange = ((stock.currentPrice - stock.fiftyTwoWeekLow) / stock.fiftyTwoWeekLow) * 100
  const fromHigh = ((stock.fiftyTwoWeekHigh - stock.currentPrice) / stock.fiftyTwoWeekHigh) * 100

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <span className="text-xl font-bold text-primary-foreground">
                  {stock.symbol.slice(0, 2)}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-foreground">{stock.symbol}</h1>
                  <Badge variant="secondary">{stock.sector}</Badge>
                </div>
                <p className="text-muted-foreground">{stock.name}</p>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-3xl font-bold text-foreground">${stock.currentPrice.toFixed(2)}</p>
              <div className="mt-1 flex items-center gap-2 md:justify-end">
                {priceChange >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={priceChange >= 0 ? 'text-success' : 'text-destructive'}>
                  {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}% (52주 최저가 대비)
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">52주 최고가</p>
              <p className="mt-1 text-lg font-semibold text-foreground">${stock.fiftyTwoWeekHigh.toFixed(2)}</p>
              <p className="text-xs text-destructive">-{fromHigh.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">52주 최저가</p>
              <p className="mt-1 text-lg font-semibold text-foreground">${stock.fiftyTwoWeekLow.toFixed(2)}</p>
              <p className="text-xs text-success">+{priceChange.toFixed(1)}%</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">시가총액</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{stock.marketCap}</p>
            </div>
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="text-sm text-muted-foreground">P/E 비율</p>
              <p className="mt-1 text-lg font-semibold text-foreground">{stock.peRatio.toFixed(1)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dividend Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-success/10 p-2">
                <Percent className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">배당수익률</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{stock.dividendYield.toFixed(2)}%</p>
            <p className="mt-1 text-sm text-muted-foreground">현재가 대비 연간 배당금 비율</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">배당금액</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">${stock.annualDividend.toFixed(2)}</p>
            <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <span>연간</span>
              <Separator orientation="vertical" className="h-4" />
              <span>분기별 ${stock.quarterlyDividend.toFixed(4)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-chart-4/10 p-2">
                <Calendar className="h-4 w-4 text-chart-4" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">배당 지급일</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <p className="text-xs text-muted-foreground">배당락일 (Ex-Dividend)</p>
                <p className="font-semibold text-foreground">{stock.exDividendDate}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">지급일 (Payment)</p>
                <p className="font-semibold text-foreground">{stock.paymentDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-chart-5/10 p-2">
                <PieChart className="h-4 w-4 text-chart-5" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">배당성향</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{stock.payoutRatio.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-muted-foreground">순이익 중 배당 지급 비율</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-chart-5"
                style={{ width: `${Math.min(stock.payoutRatio, 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-success/10 p-2">
                <BarChart3 className="h-4 w-4 text-success" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">배당 성장률</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <p className="text-3xl font-bold text-success">+{stock.dividendGrowthRate.toFixed(1)}%</p>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">전년 대비 배당 증가율</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-primary/10 p-2">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-medium text-muted-foreground">월별 예상 배당금</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">${(stock.annualDividend / 12).toFixed(2)}</p>
            <p className="mt-1 text-sm text-muted-foreground">1주 기준 월 평균</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
