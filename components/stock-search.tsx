'use client'

import { useEffect, useState } from 'react'
import { Search, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { useAuth } from '@/lib/auth-context'
import type { DividendStock } from '@/lib/types'

interface StockSearchProps {
  onSelect?: (stock: DividendStock) => void
}

export function StockSearch({ onSelect }: StockSearchProps) {
  const { addToPortfolio, portfolio } = useAuth()
  const [query, setQuery] = useState('')
  const [selectedStock, setSelectedStock] = useState<DividendStock | null>(null)
  const [shares, setShares] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchResults, setSearchResults] = useState<DividendStock[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    const trimmedQuery = query.trim()

    if (!trimmedQuery) {
      setSearchResults([])
      setSearchError(null)
      setIsSearching(false)
      return
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true)
        setSearchError(null)

        const response = await fetch(
          `/api/yahoo/dividend-search?query=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        )

        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          const status = errorData?.detail?.status
          const statusText = errorData?.detail?.statusText
          const message = status
            ? `배당 데이터를 불러오지 못했습니다. (상태: ${status}${statusText ? ` ${statusText}` : ''})`
            : '배당 데이터를 불러오지 못했습니다.'
          throw new Error(message)
        }

        const data = await response.json()
        setSearchResults(data?.results ?? [])
      } catch (error) {
        if (!controller.signal.aborted) {
          const message =
            error instanceof Error ? error.message : '배당 정보를 불러오지 못했습니다.'
          setSearchError(message)
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsSearching(false)
        }
      }
    }, 350)

    return () => {
      controller.abort()
      clearTimeout(timeoutId)
    }
  }, [query])

  const handleAddStock = async () => {
    if (!selectedStock || !shares) return

    let stockToSave = selectedStock

    try {
      const response = await fetch(`/api/yahoo/stock?symbol=${encodeURIComponent(selectedStock.symbol)}`)
      if (response.ok) {
        const data = await response.json()
        if (data?.stock?.symbol) {
          stockToSave = {
            ...data.stock,
            sector: selectedStock.sector ?? data.stock.sector,
          }
        }
      }
    } catch {
      // 상세 데이터 요청 실패 시 검색 결과 데이터로 저장
    }

    await addToPortfolio(stockToSave, Number(shares), stockToSave.currentPrice)
    setIsDialogOpen(false)
    setSelectedStock(null)
    setShares('')
    setQuery('')
  }

  const isInPortfolio = (symbol: string) => portfolio.some((p) => p.symbol === symbol)

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="종목명 또는 티커를 검색하세요 (예: AAPL, Apple)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-12 bg-secondary/50 pl-10 text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {query && (
        <div className="space-y-2 rounded-xl border border-border bg-card p-2">
          {isSearching && (
            <p className="p-4 text-center text-muted-foreground">배당 정보를 불러오는 중...</p>
          )}

          {!isSearching && searchError && (
            <p className="p-4 text-center text-destructive">{searchError}</p>
          )}

          {!isSearching && !searchError && searchResults.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">검색 결과가 없습니다</p>
          ) : (
            !isSearching &&
            !searchError &&
            searchResults.map((stock) => (
              <div
                key={stock.id}
                className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-secondary/50"
              >
                <button
                  type="button"
                  className="flex flex-1 items-center gap-4 text-left"
                  onClick={() => onSelect?.(stock)}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                    <span className="text-xs font-bold text-secondary-foreground">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{stock.symbol}</span>
                      <Badge variant="secondary" className="text-xs">
                        {stock.sector}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{stock.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${stock.currentPrice.toFixed(2)}</p>
                    <div className="flex items-center justify-end gap-1">
                      {stock.dividendYield >= 3 ? (
                        <TrendingUp className="h-3 w-3 text-success" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-muted-foreground" />
                      )}
                      <span
                        className={`text-sm ${
                          stock.dividendYield >= 3 ? 'text-success' : 'text-muted-foreground'
                        }`}
                      >
                        {stock.dividendYield.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </button>

                <Dialog open={isDialogOpen && selectedStock?.id === stock.id} onOpenChange={(open) => {
                  setIsDialogOpen(open)
                  if (!open) {
                    setSelectedStock(null)
                    setShares('')
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant={isInPortfolio(stock.symbol) ? 'secondary' : 'default'}
                      className="ml-4"
                      onClick={() => {
                        setSelectedStock(stock)
                        setIsDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      {isInPortfolio(stock.symbol) ? '추가' : '담기'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card">
                    <DialogHeader>
                      <DialogTitle className="text-foreground">포트폴리오에 추가</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-center gap-4 rounded-lg bg-secondary/50 p-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                          <span className="text-sm font-bold text-primary-foreground">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{stock.symbol}</p>
                          <p className="text-sm text-muted-foreground">{stock.name}</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="shares" className="text-foreground">보유 주식 수</Label>
                        <Input
                          id="shares"
                          type="number"
                          placeholder="예: 10"
                          value={shares}
                          onChange={(e) => setShares(e.target.value)}
                          className="bg-secondary/50 text-foreground"
                        />
                        <p className="text-xs text-muted-foreground">
                          평균 매입가는 현재가 기준으로 자동 적용됩니다.
                        </p>
                      </div>

                      {shares && (
                        <div className="rounded-lg bg-secondary/50 p-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">총 투자금액</span>
                            <span className="font-semibold text-foreground">
                              ${(Number(shares) * stock.currentPrice).toFixed(2)}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-between text-sm">
                            <span className="text-muted-foreground">예상 연간 배당금</span>
                            <span className="font-semibold text-success">
                              ${(Number(shares) * stock.annualDividend).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full"
                        onClick={handleAddStock}
                        disabled={!shares}
                      >
                        포트폴리오에 추가
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
