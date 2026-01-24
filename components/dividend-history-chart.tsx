'use client'

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'
import type { DividendHistory } from '@/lib/types'
import { getYearlyDividendData } from '@/lib/mock-data'

interface DividendHistoryChartProps {
  symbol: string
  history: DividendHistory[]
}

export function DividendHistoryChart({ symbol, history }: DividendHistoryChartProps) {
  const yearlyData = getYearlyDividendData(symbol)
  
  const chartColors = {
    dividend: '#4f87ff',
    increase: '#22c55e',
    decrease: '#ef4444',
  }

  const hasCuts = history.some((h) => h.isCut)
  const consecutiveGrowth = history.filter((h) => h.changePercent > 0).length

  return (
    <div className="space-y-6">
      {/* Yearly Dividend Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">연간 배당금 추이</CardTitle>
          <CardDescription>최근 {yearlyData.length}년간 배당금 변화</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              dividend: {
                label: '연간 배당금',
                color: chartColors.dividend,
              },
            }}
            className="h-[300px]"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="year" 
                  tickLine={false} 
                  axisLine={false}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: 'var(--muted-foreground)' }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  cursor={{ fill: 'var(--secondary)' }}
                />
                <Bar dataKey="dividend" radius={[6, 6, 0, 0]} fill={chartColors.dividend}>
                  {yearlyData.map((entry, index) => {
                    const prevValue = index > 0 ? yearlyData[index - 1].dividend : entry.dividend
                    const isIncrease = entry.dividend >= prevValue
                    return (
                      <Cell 
                        key={`cell-${entry.year}`} 
                        fill={isIncrease ? chartColors.increase : chartColors.decrease}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <TrendingUp className="h-3 w-3 text-success" />
              {consecutiveGrowth}회 증가
            </Badge>
            {hasCuts && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                배당 삭감 이력 있음
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quarterly History Table */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">분기별 배당 내역</CardTitle>
          <CardDescription>과거 배당 지급 히스토리</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {history.slice(0, 12).map((record, index) => (
              <div
                key={`${record.year}-${record.quarter}`}
                className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{record.year}</p>
                    <p className="text-xs text-muted-foreground">{record.quarter}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-xs text-muted-foreground">배당락일</p>
                    <p className="text-sm text-foreground">{record.exDate}</p>
                  </div>
                  <div className="hidden md:block">
                    <p className="text-xs text-muted-foreground">지급일</p>
                    <p className="text-sm text-foreground">{record.payDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${record.amount.toFixed(4)}</p>
                    {record.changePercent !== 0 && (
                      <div className="flex items-center justify-end gap-1">
                        {record.changePercent > 0 ? (
                          <TrendingUp className="h-3 w-3 text-success" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-destructive" />
                        )}
                        <span
                          className={`text-xs ${
                            record.changePercent > 0 ? 'text-success' : 'text-destructive'
                          }`}
                        >
                          {record.changePercent > 0 ? '+' : ''}{record.changePercent.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                  {record.isCut && (
                    <Badge variant="destructive" className="text-xs">
                      삭감
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
