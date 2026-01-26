'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  TrendingUp,
  Calendar,
  PieChart,
  BarChart3,
  ArrowRight,
  Check,
  Eye,
  EyeClosed,
} from 'lucide-react'
type YahooTicker = {
  symbol: string
  name: string
  price: number | null
  changePercent: number | null
  currency: string
}

const features = [
  {
    icon: PieChart,
    title: '포트폴리오 관리',
    description: '보유한 배당주를 한눈에 관리하고 총 배당수익을 확인하세요.',
  },
  {
    icon: BarChart3,
    title: '배당 히스토리',
    description: '최대 10년간의 배당 지급 내역과 성장률을 분석하세요.',
  },
  {
    icon: Calendar,
    title: '배당 캘린더',
    description: '배당락일과 지급일을 캘린더에서 놓치지 마세요.',
  },
  {
    icon: TrendingUp,
    title: '수익률 분석',
    description: '배당수익률, 배당성향, P/E 비율 등 핵심 지표를 확인하세요.',
  },
]

const benefits = [
  '실시간 배당 정보 업데이트',
  '직관적인 포트폴리오 대시보드',
  '과거 배당 히스토리 분석',
  '배당락일/지급일 알림 캘린더',
  '종목별 상세 배당 정보',
  '다크모드 지원',
]

export default function LandingPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [tickers, setTickers] = useState<YahooTicker[]>([])
  const [isTickerLoading, setIsTickerLoading] = useState(true)
  const [tickerError, setTickerError] = useState<string | null>(null)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard')
    }
  }, [user, isLoading, router])

  useEffect(() => {
    let isMounted = true

    const loadTickers = async () => {
      try {
        setIsTickerLoading(true)
        setTickerError(null)

        const response = await fetch('/api/yahoo/tickers')
        if (!response.ok) {
          throw new Error('Yahoo Finance 응답 오류')
        }

        const data = await response.json()
        if (isMounted) {
          setTickers(data?.tickers ?? [])
        }
      } catch (error) {
        if (isMounted) {
          setTickerError('티커 정보를 불러오지 못했습니다.')
        }
      } finally {
        if (isMounted) {
          setIsTickerLoading(false)
        }
      }
    }

    loadTickers()

    return () => {
      isMounted = false
    }
  }, [])

  const formatPrice = (value: number | null, currency: string) => {
    if (typeof value !== 'number') {
      return '-'
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatChangePercent = (value: number | null) => {
    if (typeof value !== 'number') {
      return '-'
    }

    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  if (isLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">배당 TRACKER</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground"
            >
              {isDark ? <EyeClosed className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">로그인</Button>
            </Link>
            <Link href="/register">
              <Button>회원가입</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-20 md:py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            배당 TRACKER
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
            배당락일, 지급일, 예상 수익까지 — 미국 배당주 투자자를 위한 올인원 트래커
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/register">
              <Button size="lg" className="w-full gap-2 sm:w-auto">
                시작하기
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                로그인
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-secondary/30 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">주요 기능</h2>
            <p className="mt-4 text-muted-foreground">
              배당 투자에 필요한 모든 정보를 한 곳에서 확인하세요
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-foreground">
                배당 투자를 위한 완벽한 도구
              </h2>
              <p className="mt-4 text-muted-foreground">
                배당 TRACKER는 배당 투자자를 위해 설계된 올인원 플랫폼입니다. 
                복잡한 정보를 깔끔하게 정리하여 투자 결정을 도와드립니다.
              </p>

              <ul className="mt-8 space-y-4">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-success/20">
                      <Check className="h-4 w-4 text-success" />
                    </div>
                    <span className="text-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>

              <Link href="/register" className="mt-8 inline-block">
                <Button size="lg" className="gap-2">
                  지금 시작하기
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="relative">
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xl">
                <div className="mb-4 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-destructive/50" />
                  <div className="h-3 w-3 rounded-full bg-chart-4/50" />
                  <div className="h-3 w-3 rounded-full bg-success/50" />
                </div>
                <div className="space-y-4">
                  <div className="rounded-lg bg-secondary/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">총 예상 연간 배당금</p>
                        <p className="text-2xl font-bold text-foreground">$2,847.50</p>
                      </div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
                        <TrendingUp className="h-6 w-6 text-success" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <p className="text-sm text-muted-foreground">평균 수익률</p>
                      <p className="text-xl font-bold text-success">4.32%</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-4">
                      <p className="text-sm text-muted-foreground">보유 종목</p>
                      <p className="text-xl font-bold text-foreground">8개</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {['AAPL', 'MSFT', 'JNJ'].map((symbol) => (
                      <div key={symbol} className="flex items-center justify-between rounded-lg bg-secondary/30 p-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                            <span className="text-xs font-bold text-primary-foreground">
                              {symbol.slice(0, 2)}
                            </span>
                          </div>
                          <span className="font-medium text-foreground">{symbol}</span>
                        </div>
                        <span className="text-success">+2.4%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Yahoo Finance Ticker Section */}
      <section className="bg-secondary/30 px-4 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground">
              Yahoo Finance 미국 주식 티커
            </h2>
            <p className="mt-4 text-muted-foreground">
              Yahoo Finance에서 가장 활발한 미국 주식 티커를 불러옵니다.
            </p>
          </div>

          <div className="mt-10">
            {isTickerLoading && (
              <div className="flex items-center justify-center text-muted-foreground">
                티커 정보를 불러오는 중...
              </div>
            )}

            {!isTickerLoading && tickerError && (
              <div className="flex items-center justify-center text-destructive">
                {tickerError}
              </div>
            )}

            {!isTickerLoading && !tickerError && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tickers.map((ticker) => (
                  <Card key={ticker.symbol} className="border-border bg-card">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">{ticker.symbol}</p>
                          <p className="text-lg font-semibold text-foreground">{ticker.name}</p>
                        </div>
                        <span
                          className={
                            ticker.changePercent !== null && ticker.changePercent >= 0
                              ? 'text-success'
                              : 'text-destructive'
                          }
                        >
                          {formatChangePercent(ticker.changePercent)}
                        </span>
                      </div>
                      <p className="mt-4 text-xl font-bold text-foreground">
                        {formatPrice(ticker.price, ticker.currency)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary px-4 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-bold text-primary-foreground">
            지금 바로 배당 투자를 시작하세요
          </h2>
          <p className="mt-4 text-primary-foreground/80">
            무료로 가입하고 스마트한 배당 투자의 첫 걸음을 내딛으세요.
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="mt-8">
              회원가입
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card px-4 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <TrendingUp className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">배당 TRACKER</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2024 배당 TRACKER. 투자에 대한 모든 결정은 본인의 책임입니다.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
