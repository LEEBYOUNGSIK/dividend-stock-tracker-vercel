'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Header } from '@/components/header'
import { StockSearch } from '@/components/stock-search'
import { PortfolioSummary } from '@/components/portfolio-summary'
import { PortfolioTable } from '@/components/portfolio-table'
import { Skeleton } from '@/components/ui/skeleton'
import type { DividendStock } from '@/lib/types'

export default function DashboardPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  const handleStockSelect = (stock: DividendStock) => {
    router.push(`/stock/${stock.symbol}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-6">
            <Skeleton className="h-12 w-full" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
            <Skeleton className="h-96" />
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            안녕하세요, {user.name}님
          </h1>
          <p className="mt-1 text-muted-foreground">
            오늘의 배당 포트폴리오를 확인해보세요
          </p>
        </div>

        <div className="space-y-8">
          {/* Stock Search */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">배당주 검색</h2>
            <StockSearch onSelect={handleStockSelect} />
          </section>

          {/* Portfolio Summary */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">포트폴리오 요약</h2>
            <PortfolioSummary />
          </section>

          {/* Portfolio Table */}
          <section>
            <h2 className="mb-4 text-lg font-semibold text-foreground">보유 종목</h2>
            <PortfolioTable />
          </section>
        </div>
      </main>
    </div>
  )
}
