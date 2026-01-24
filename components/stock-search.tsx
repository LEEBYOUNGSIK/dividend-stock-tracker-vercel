'use client'

import { useState } from 'react'
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
import { mockStocks } from '@/lib/mock-data'
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
  const [averageCost, setAverageCost] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const filteredStocks = mockStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
      stock.name.toLowerCase().includes(query.toLowerCase())
  )

  const handleAddStock = () => {
    if (selectedStock && shares && averageCost) {
      addToPortfolio(selectedStock.symbol, Number(shares), Number(averageCost))
      setIsDialogOpen(false)
      setSelectedStock(null)
      setShares('')
      setAverageCost('')
      setQuery('')
    }
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
          {filteredStocks.length === 0 ? (
            <p className="p-4 text-center text-muted-foreground">검색 결과가 없습니다</p>
          ) : (
            filteredStocks.map((stock) => (
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
                    setAverageCost('')
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant={isInPortfolio(stock.symbol) ? 'secondary' : 'default'}
                      className="ml-4"
                      onClick={() => {
                        setSelectedStock(stock)
                        setAverageCost(stock.currentPrice.toString())
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
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="avgCost" className="text-foreground">평균 매입가 ($)</Label>
                        <Input
                          id="avgCost"
                          type="number"
                          step="0.01"
                          placeholder="예: 150.00"
                          value={averageCost}
                          onChange={(e) => setAverageCost(e.target.value)}
                          className="bg-secondary/50 text-foreground"
                        />
                      </div>

                      {shares && averageCost && (
                        <div className="rounded-lg bg-secondary/50 p-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">총 투자금액</span>
                            <span className="font-semibold text-foreground">
                              ${(Number(shares) * Number(averageCost)).toFixed(2)}
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
                        disabled={!shares || !averageCost}
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
