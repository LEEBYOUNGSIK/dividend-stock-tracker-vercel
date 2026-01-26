import { NextResponse } from 'next/server'

const YAHOO_TICKER_URL =
  'https://query1.finance.yahoo.com/v1/finance/screener/predefined/saved?count=10&scrIds=most_actives'

type YahooQuote = {
  symbol?: string
  shortName?: string
  regularMarketPrice?: number
  regularMarketChangePercent?: number
  currency?: string
}

export async function GET() {
  try {
    const response = await fetch(YAHOO_TICKER_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 300 },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Yahoo Finance 응답이 정상적이지 않습니다.' },
        { status: 502 },
      )
    }

    const data = await response.json()
    const quotes: YahooQuote[] = data?.finance?.result?.[0]?.quotes ?? []

    const tickers = quotes
      .filter((quote) => quote?.symbol && quote?.shortName)
      .map((quote) => ({
        symbol: quote.symbol,
        name: quote.shortName,
        price: quote.regularMarketPrice ?? null,
        changePercent: quote.regularMarketChangePercent ?? null,
        currency: quote.currency ?? 'USD',
      }))

    return NextResponse.json({ tickers })
  } catch (error) {
    return NextResponse.json(
      { error: 'Yahoo Finance 데이터를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}
