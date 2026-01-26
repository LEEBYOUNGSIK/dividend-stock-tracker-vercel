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

interface DividendHistoryChartProps {
  symbol: string
  history: DividendHistory[]
  currentPrice: number
}

export function DividendHistoryChart({
  symbol: _symbol,
  history,
  currentPrice,
}: DividendHistoryChartProps) {
  if (history.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">배당 히스토리</CardTitle>
          <CardDescription>현재는 배당 히스토리를 제공할 수 없습니다.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Yahoo Finance에서 배당 히스토리 데이터가 제공되지 않아 표시할 수 없습니다.
          </p>
        </CardContent>
      </Card>
    )
  }

  const parseDateValue = (value: string) => {
    const date = new Date(value)
    const timestamp = date.getTime()
    return Number.isNaN(timestamp) ? null : timestamp
  }

  const sortedByDate = [...history]
    .map((record) => ({
      ...record,
      dateValue: parseDateValue(record.exDate),
    }))
    .filter((record) => record.dateValue !== null)
    .sort((a, b) => (a.dateValue ?? 0) - (b.dateValue ?? 0))

  const intervals = sortedByDate
    .slice(1)
    .map((record, index) => {
      const prev = sortedByDate[index]
      if (!prev?.dateValue || !record.dateValue) return null
      return Math.max(0, (record.dateValue - prev.dateValue) / (1000 * 60 * 60 * 24))
    })
    .filter((value): value is number => value !== null && value > 0)

  const cadenceFromInterval = (days: number) => {
    if (days <= 45) return 'monthly'
    if (days <= 120) return 'quarterly'
    if (days <= 210) return 'semiannual'
    return 'annual'
  }

  const getCadence = () => {
    if (intervals.length === 0) return 'annual'
    const sorted = [...intervals].sort((a, b) => a - b)
    const median = sorted[Math.floor(sorted.length / 2)]
    return cadenceFromInterval(median)
  }

  const detectedCadence = getCadence()
  const historyWithCadence = history.map((record) => ({
    ...record,
    cadence: detectedCadence,
  }))

  const cadenceMap = {
    monthly: historyWithCadence.filter((record) => record.cadence === 'monthly'),
    quarterly: historyWithCadence.filter((record) => record.cadence === 'quarterly'),
    semiannual: historyWithCadence.filter((record) => record.cadence === 'semiannual'),
    annual: historyWithCadence.filter((record) => record.cadence === 'annual'),
  }

  const yearlyData = history.reduce<Record<number, number>>((acc, record) => {
    if (!acc[record.year]) {
      acc[record.year] = 0
    }
    acc[record.year] += record.amount
    return acc
  }, {})

  const yearlyDataList = Object.entries(yearlyData)
    .map(([year, dividend]) => ({ year: Number(year), dividend: Number(dividend.toFixed(4)) }))
    .sort((a, b) => a.year - b.year)
  const yearlyDataListDesc = [...yearlyDataList].sort((a, b) => b.year - a.year)
  const latestYear = yearlyDataList.length > 0 ? yearlyDataList[yearlyDataList.length - 1].year : 0
  const prevYear = yearlyDataList.length > 1 ? yearlyDataList[yearlyDataList.length - 2].year : 0
  const yearlyCounts = history.reduce<Record<number, number>>((acc, record) => {
    acc[record.year] = (acc[record.year] ?? 0) + 1
    return acc
  }, {})
  const cadenceExpectedCount: Record<string, number> = {
    monthly: 12,
    quarterly: 4,
    semiannual: 2,
    annual: 1,
  }
  const expectedCount = cadenceExpectedCount[detectedCadence] ?? 0
  const latestYearCount = latestYear ? yearlyCounts[latestYear] ?? 0 : 0
  const prevYearCount = prevYear ? yearlyCounts[prevYear] ?? 0 : 0
  const latestTotal = latestYear ? yearlyData[latestYear] ?? 0 : 0
  const prevTotal = prevYear ? yearlyData[prevYear] ?? 0 : 0
  const latestYearMonths = latestYear
    ? history
        .filter((record) => record.year === latestYear)
        .map((record) => new Date(`${record.exDate}T00:00:00Z`).getUTCMonth() + 1)
        .filter((value) => Number.isFinite(value))
    : []
  const latestYearMonthSet = new Set(latestYearMonths)
  const missingMonths =
    detectedCadence === 'monthly' && latestYear
      ? Array.from({ length: 12 }, (_, index) => index + 1).filter(
          (month) => !latestYearMonthSet.has(month),
        )
      : []
  const currentYear = new Date().getUTCFullYear()
  const remainingCount =
    expectedCount > 0 && latestYearCount <= expectedCount
      ? expectedCount - latestYearCount
      : 0
  let yearDiffNote = ''
  if (latestYear && prevYear && expectedCount > 0) {
    if (latestYearCount < expectedCount) {
      yearDiffNote = `${latestYear}년은 ${expectedCount}회 중 ${latestYearCount}회만 집계되어 연간 합계가 낮게 표시됩니다.`
      if (missingMonths.length > 0) {
        yearDiffNote += ` 미집계 월: ${missingMonths.join(', ')}월`
      }
      if (latestYear === currentYear && remainingCount > 0) {
        yearDiffNote += ` 아직 공개되지 않은 배당 ${remainingCount}회가 남아 있어(예: 4분기) 데이터가 누락될 수 있습니다.`
      }
    } else if (prevYearCount < expectedCount) {
      yearDiffNote = `${prevYear}년은 ${expectedCount}회 중 ${prevYearCount}회만 집계되어 연간 합계가 낮게 표시됩니다.`
    } else if (latestTotal !== prevTotal) {
      yearDiffNote = `연간 합계 차이는 배당금 단가 변화(인상/감액)로 발생합니다.`
    }
  }
  const chartYearStart = latestYear ? latestYear - 9 : 0
  const chartYearlyData = yearlyDataList.filter((entry) => entry.year >= chartYearStart)
  
  const chartColors = {
    dividend: '#4f87ff',
    increase: '#22c55e',
    decrease: '#ef4444',
  }

  const hasCuts = history.some((h) => h.isCut)
  const consecutiveGrowth = history.filter((h) => h.changePercent > 0).length

  const renderHistoryTable = (
    items: Array<DividendHistory & { cadence?: string }>,
    options?: { showPayDate?: boolean },
  ) => {
    if (items.length === 0) {
      return (
        <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          해당 주기로 배당 내역이 없습니다.
        </div>
      )
    }

    const cadenceLabel = (value?: string) => {
      switch (value) {
        case 'monthly':
          return '월'
        case 'quarterly':
          return '3M'
        case 'semiannual':
          return '6M'
        case 'annual':
          return '1Y'
        default:
          return '-'
      }
    }

    const cadenceFrequency = (value?: string) => {
      switch (value) {
        case 'monthly':
          return 12
        case 'quarterly':
          return 4
        case 'semiannual':
          return 2
        case 'annual':
          return 1
        default:
          return 0
      }
    }

    return (
      <div className="space-y-2">
        <div className="hidden grid-cols-6 gap-4 border-b border-border pb-2 text-center text-xs text-muted-foreground sm:grid">
          <span>배당락일</span>
          <span>배당</span>
          <span>유형</span>
          <span>지급일</span>
          <span>수익률</span>
          <span>비고</span>
        </div>

        {items.slice(0, 12).map((record) => (
          <div
            key={`${record.year}-${record.quarter}-${record.exDate}`}
            className="grid grid-cols-[1fr] gap-2 rounded-lg bg-secondary/30 p-3 text-sm sm:grid-cols-6 sm:gap-4 sm:text-center"
          >
            <div>
              <p className="text-xs text-muted-foreground sm:hidden">배당락일</p>
              <p className="text-foreground">{record.exDate}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:hidden">배당</p>
              <p className="font-semibold text-foreground">${record.amount.toFixed(4)}</p>
              {record.changePercent !== 0 && (
                <div className="mt-1 flex items-center justify-center gap-1 text-xs">
                  {record.changePercent > 0 ? (
                    <TrendingUp className="h-3 w-3 text-success" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-destructive" />
                  )}
                  <span
                    className={`${
                      record.changePercent > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {record.changePercent > 0 ? '+' : ''}
                    {record.changePercent.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground sm:hidden">유형</p>
              <span className="inline-flex items-center justify-center rounded-md border border-border px-2 py-1 text-xs text-muted-foreground">
                {cadenceLabel(record.cadence)}
              </span>
            </div>
            <div className={options?.showPayDate ? '' : 'hidden sm:block'}>
              <p className="text-xs text-muted-foreground sm:hidden">지급일</p>
              <p className="text-foreground">{record.payDate || '-'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:hidden">수익률</p>
              <p className="text-foreground">
                {currentPrice > 0 && cadenceFrequency(record.cadence) > 0
                  ? `${((record.amount * cadenceFrequency(record.cadence)) / currentPrice * 100).toFixed(2)}%`
                  : '-'}
              </p>
              {record.isCut && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  삭감
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground sm:hidden">비고</p>
              <p className="text-foreground">{record.remark || '-'}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const hasAnyCadence =
    cadenceMap.monthly.length > 0 ||
    cadenceMap.quarterly.length > 0 ||
    cadenceMap.semiannual.length > 0 ||
    cadenceMap.annual.length > 0

  return (
    <div className="space-y-6">
      <div className="grid items-stretch gap-6 lg:grid-cols-2">
        <Card className="h-full border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">배당 차트</CardTitle>
            <CardDescription>연간 배당금 추이</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ChartContainer
              config={{
                dividend: {
                  label: '연간 배당금',
                  color: chartColors.dividend,
                },
              }}
              className="h-[300px] w-full aspect-auto justify-stretch"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartYearlyData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  barCategoryGap={12}
                >
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
                  <Bar
                    dataKey="dividend"
                    radius={[6, 6, 0, 0]}
                    fill={chartColors.dividend}
                    barSize={22}
                  >
                    {chartYearlyData.map((entry, index) => {
                      const prevValue =
                        index > 0 ? chartYearlyData[index - 1].dividend : entry.dividend
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

            <div className="px-4 pb-4 pt-4 flex flex-wrap gap-2">
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

        <Card className="h-full border-border bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">연간 배당 합계</CardTitle>
            <CardDescription>연 단위 배당 합계 내역</CardDescription>
          </CardHeader>
          <CardContent>
            {yearDiffNote && (
              <div className="mb-3 rounded-lg border border-dashed border-border bg-secondary/30 p-3 text-xs text-muted-foreground">
                {yearDiffNote}
              </div>
            )}
            <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2">
              {yearlyDataListDesc.map((entry) => (
                <div
                  key={`year-${entry.year}`}
                  className="flex items-center justify-between rounded-lg bg-secondary/30 p-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{entry.year}</p>
                    <p className="text-xs text-muted-foreground">연간 합계</p>
                  </div>
                  <p className="font-semibold text-foreground">${entry.dividend.toFixed(4)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">배당 히스토리 상세 정보</h3>
          <p className="text-sm text-muted-foreground">
            지급 주기별 배당 내역을 확인하세요.
          </p>
        </div>

        {!hasAnyCadence && (
          <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            표시할 배당 내역이 없습니다.
          </div>
        )}

        {cadenceMap.monthly.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">월별 배당 내역</CardTitle>
              <CardDescription>월 배당 종목의 최근 배당 내역</CardDescription>
            </CardHeader>
            <CardContent>{renderHistoryTable(cadenceMap.monthly, { showPayDate: true })}</CardContent>
          </Card>
        )}

        {cadenceMap.quarterly.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">분기별 배당 내역</CardTitle>
              <CardDescription>분기 배당 종목의 최근 배당 내역</CardDescription>
            </CardHeader>
            <CardContent>{renderHistoryTable(cadenceMap.quarterly)}</CardContent>
          </Card>
        )}

        {cadenceMap.semiannual.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">반기별 배당 내역</CardTitle>
              <CardDescription>반기 배당 종목의 최근 배당 내역</CardDescription>
            </CardHeader>
            <CardContent>{renderHistoryTable(cadenceMap.semiannual)}</CardContent>
          </Card>
        )}

        {cadenceMap.annual.length > 0 && (
          <Card className="border-border bg-card">
            <CardHeader>
              <CardTitle className="text-foreground">연별 배당 내역</CardTitle>
              <CardDescription>연 배당 종목의 최근 배당 내역</CardDescription>
            </CardHeader>
            <CardContent>{renderHistoryTable(cadenceMap.annual)}</CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
