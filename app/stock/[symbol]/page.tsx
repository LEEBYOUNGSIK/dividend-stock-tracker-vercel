'use client'

import { useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { StockDetailCard } from '@/components/stock-detail-card'
import { DividendHistoryChart } from '@/components/dividend-history-chart'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Plus } from 'lucide-react'
import type { DividendStock, DividendHistory } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { user, isLoading, addToPortfolio, portfolio } = useAuth()
  const [shares, setShares] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [stock, setStock] = useState<DividendStock | null>(null)
  const [history, setHistory] = useState<DividendHistory[]>([])
  const [isStockLoading, setIsStockLoading] = useState(true)
  const [stockError, setStockError] = useState<string | null>(null)

  const symbol = resolvedParams.symbol.toUpperCase()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    let isMounted = true

    const loadStock = async () => {
      try {
        setIsStockLoading(true)
        setStockError(null)

        const response = await fetch(`/api/yahoo/stock?symbol=${encodeURIComponent(symbol)}`)
        if (!response.ok) {
          const errorData = await response.json().catch(() => null)
          const message =
            errorData?.error ||
            `종목 정보를 불러오지 못했습니다. (상태: ${response.status})`
          throw new Error(message)
        }

        const data = await response.json()
        if (isMounted) {
          setStock(data?.stock ?? null)
          setHistory(data?.history ?? [])
        }
      } catch (error) {
        if (isMounted) {
          setStockError(
            error instanceof Error ? error.message : '종목 정보를 불러오지 못했습니다.',
          )
        }
      } finally {
        if (isMounted) {
          setIsStockLoading(false)
        }
      }
    }

    if (symbol) {
      loadStock()
    }

    return () => {
      isMounted = false
    }
  }, [symbol])

  const handleAddStock = async () => {
    if (stock && shares) {
      await addToPortfolio(stock, Number(shares), stock.currentPrice)
      setIsDialogOpen(false)
      setShares('')
    }
  }

  const isInPortfolio = stock ? portfolio.some((p) => p.symbol === stock.symbol) : false

  if (isLoading || isStockLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="mb-6 h-10 w-32" />
          <div className="space-y-6">
            <Skeleton className="h-64" />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (stockError) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32">
          <h1 className="text-2xl font-bold text-foreground">종목 정보를 불러오지 못했습니다</h1>
          <p className="mt-2 text-muted-foreground">{stockError}</p>
          <Link href="/dashboard">
            <Button className="mt-6">대시보드로 돌아가기</Button>
          </Link>
        </main>
      </div>
    )
  }

  if (!stock) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-32">
          <h1 className="text-2xl font-bold text-foreground">종목을 찾을 수 없습니다</h1>
          <p className="mt-2 text-muted-foreground">요청하신 종목 정보가 존재하지 않습니다.</p>
          <Link href="/dashboard">
            <Button className="mt-6">대시보드로 돌아가기</Button>
          </Link>
        </main>
      </div>
    )
  }
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        {/* Back button and Add to portfolio */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard">
            <Button variant="ghost" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
              대시보드
            </Button>
          </Link>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant={isInPortfolio ? 'secondary' : 'default'}>
                <Plus className="mr-2 h-4 w-4" />
                {isInPortfolio ? '추가 매수' : '포트폴리오에 추가'}
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
                  <Label htmlFor="modal-shares" className="text-foreground">보유 주식 수</Label>
                  <Input
                    id="modal-shares"
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

        <div className="space-y-8">
          {/* Stock Detail Card */}
          <StockDetailCard stock={stock} />

          {/* Dividend History */}
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">배당 히스토리</h2>
            <DividendHistoryChart
              symbol={stock.symbol}
              history={history}
              currentPrice={stock.currentPrice}
            />
          </section>
        </div>
      </main>
    </div>
  )
}
