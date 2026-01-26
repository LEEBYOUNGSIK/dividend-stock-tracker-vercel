import { NextResponse } from 'next/server'

const YAHOO_QUOTE_URLS = [
  'https://query1.finance.yahoo.com/v7/finance/quote',
  'https://query2.finance.yahoo.com/v7/finance/quote',
]
const YAHOO_CRUMB_URLS = [
  'https://query1.finance.yahoo.com/v1/test/getcrumb',
  'https://query2.finance.yahoo.com/v1/test/getcrumb',
]
const YAHOO_COOKIE_URL = 'https://fc.yahoo.com'

type YahooQuote = {
  symbol?: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  dividendYield?: number
  dividendRate?: number
  marketCap?: number
  trailingEps?: number
  trailingPE?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
}

type YahooDividendEvent = {
  date: number
  amount: number
}

type YahooCalendarEvents = {
  exDividendDate?: { raw?: number }
  dividendDate?: { raw?: number }
}

const toNumber = (value?: number, fallback = 0) =>
  typeof value === 'number' ? value : fallback

const toPercent = (value?: number) => {
  if (typeof value !== 'number') {
    return 0
  }

  return value <= 1 ? value * 100 : value
}

const addDaysToDate = (dateString: string, days: number) => {
  const base = new Date(`${dateString}T00:00:00Z`)
  if (Number.isNaN(base.getTime())) {
    return ''
  }
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

const formatMarketCap = (value?: number) => {
  if (typeof value !== 'number' || value <= 0) {
    return 'N/A'
  }

  if (value >= 1e12) {
    return `${(value / 1e12).toFixed(2)}T`
  }

  if (value >= 1e9) {
    return `${(value / 1e9).toFixed(2)}B`
  }

  if (value >= 1e6) {
    return `${(value / 1e6).toFixed(2)}M`
  }

  return value.toFixed(0)
}

const createYahooHeaders = () => ({
  'User-Agent': 'Mozilla/5.0',
  Referer: 'https://finance.yahoo.com',
  Origin: 'https://finance.yahoo.com',
  Accept: 'application/json,text/plain,*/*',
  'Accept-Language': 'en-US,en;q=0.9',
})

const YAHOO_CHART_URLS = [
  'https://query1.finance.yahoo.com/v8/finance/chart',
  'https://query2.finance.yahoo.com/v8/finance/chart',
]
const YAHOO_SUMMARY_URLS = [
  'https://query1.finance.yahoo.com/v10/finance/quoteSummary',
  'https://query2.finance.yahoo.com/v10/finance/quoteSummary',
]

type YahooFetchError = {
  url: string
  status: number
  statusText: string
  body: string
}

type YahooAuth = {
  cookie: string
  crumb: string
}

const parseSetCookieHeader = (value: string | null) => {
  if (!value) {
    return ''
  }

  const parts = value.split(',').map((entry) => entry.trim())
  const cookies = parts
    .map((entry) => entry.split(';')[0])
    .filter(Boolean)
    .join('; ')

  return cookies
}

const fetchYahooAuth = async (): Promise<YahooAuth | null> => {
  const cookieResponse = await fetch(YAHOO_COOKIE_URL, {
    headers: createYahooHeaders(),
    cache: 'no-store',
  })
  const cookie = parseSetCookieHeader(cookieResponse.headers.get('set-cookie'))

  for (const crumbUrl of YAHOO_CRUMB_URLS) {
    const crumbResponse = await fetch(crumbUrl, {
      headers: {
        ...createYahooHeaders(),
        Cookie: cookie,
      },
      cache: 'no-store',
    })

    if (crumbResponse.ok) {
      const crumb = (await crumbResponse.text()).trim()
      if (crumb) {
        return { cookie, crumb }
      }
    }
  }

  return null
}

const fetchYahooJson = async (urls: string[], auth?: YahooAuth) => {
  let lastError: YahooFetchError | null = null

  for (const url of urls) {
    const response = await fetch(url, {
      headers: auth
        ? {
            ...createYahooHeaders(),
            Cookie: auth.cookie,
          }
        : createYahooHeaders(),
      cache: 'no-store',
    })

    if (response.ok) {
      const data = await response.json()
      return { ok: true, data, url }
    }

    const body = await response.text().catch(() => '')
    lastError = {
      url,
      status: response.status,
      statusText: response.statusText,
      body: body.slice(0, 500),
    }
  }

  return { ok: false, error: lastError }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const symbol = searchParams.get('symbol')?.trim().toUpperCase()

  if (!symbol) {
    return NextResponse.json({ error: '심볼이 필요합니다.' }, { status: 400 })
  }

  try {
    const auth = await fetchYahooAuth()
    const quoteUrls = YAHOO_QUOTE_URLS.map(
      (base) =>
        `${base}?symbols=${encodeURIComponent(symbol)}${
          auth?.crumb ? `&crumb=${encodeURIComponent(auth.crumb)}` : ''
        }`,
    )
    const quoteResult = await fetchYahooJson(quoteUrls, auth ?? undefined)

    if (!quoteResult.ok) {
      return NextResponse.json(
        { error: 'Yahoo Finance 상세 데이터에 실패했습니다.', detail: quoteResult.error },
        { status: 502 },
      )
    }

    const quoteData = quoteResult.data
    const quoteResults: YahooQuote[] = quoteData?.quoteResponse?.result ?? []
    const item = quoteResults.find((quote) => quote?.symbol === symbol)

    if (!item) {
      return NextResponse.json({ error: '종목을 찾을 수 없습니다.' }, { status: 404 })
    }

    const annualDividend = toNumber(item.dividendRate)
    const dividendYield = toPercent(item.dividendYield)

    const summaryUrls = YAHOO_SUMMARY_URLS.map(
      (base) =>
        `${base}/${encodeURIComponent(symbol)}?modules=calendarEvents${
          auth?.crumb ? `&crumb=${encodeURIComponent(auth.crumb)}` : ''
        }`,
    )
    const summaryResult = await fetchYahooJson(summaryUrls, auth ?? undefined)
    const calendarEvents: YahooCalendarEvents | undefined =
      summaryResult.ok ? summaryResult.data?.quoteSummary?.result?.[0]?.calendarEvents : undefined
    const exDividendRaw = calendarEvents?.exDividendDate?.raw
    const payDateRaw = calendarEvents?.dividendDate?.raw
    const payLagDays =
      typeof exDividendRaw === 'number' &&
      typeof payDateRaw === 'number' &&
      payDateRaw > exDividendRaw
        ? Math.round((payDateRaw - exDividendRaw) / 86400)
        : 0

    const chartUrls = YAHOO_CHART_URLS.map(
      (base) =>
        `${base}/${encodeURIComponent(symbol)}?interval=1mo&range=10y&events=div%2Csplit${
          auth?.crumb ? `&crumb=${encodeURIComponent(auth.crumb)}` : ''
        }`,
    )
    const chartResult = await fetchYahooJson(chartUrls, auth ?? undefined)
    const chartData = chartResult.ok ? chartResult.data : null
    const dividendEvents: YahooDividendEvent[] = chartData?.chart?.result?.[0]?.events?.dividends
      ? Object.values(chartData.chart.result[0].events.dividends)
      : []

    const changeThreshold = 0.1
    const cutThreshold = -0.5
    const specialMultiplier = 1.5
    const amountList = dividendEvents.map((event) => Number(event.amount.toFixed(4))).filter((v) => v > 0)
    const sortedAmounts = [...amountList].sort((a, b) => a - b)
    const medianAmount =
      sortedAmounts.length > 0
        ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]
        : 0
    const history = dividendEvents
      .sort((a, b) => b.date - a.date)
      .map((event, index, list) => {
        const exDate = new Date(event.date * 1000).toISOString().slice(0, 10)
        const month = new Date(event.date * 1000).getUTCMonth()
        const quarter = `Q${Math.floor(month / 3) + 1}`
        const prev = list[index + 1]
        const currentAmount = Number(event.amount.toFixed(4))
        const prevAmount = prev ? Number(prev.amount.toFixed(4)) : 0
        const rawChangePercent =
          prevAmount > 0 ? ((currentAmount - prevAmount) / prevAmount) * 100 : 0
        const changePercent =
          Math.abs(rawChangePercent) < changeThreshold ? 0 : rawChangePercent
        const isSpecial =
          medianAmount > 0 && currentAmount >= medianAmount * specialMultiplier
        const prevIsSpecial =
          medianAmount > 0 && prevAmount >= medianAmount * specialMultiplier

        return {
          year: Number(exDate.slice(0, 4)),
          quarter,
          amount: currentAmount,
          exDate,
          payDate: payLagDays > 0 ? addDaysToDate(exDate, payLagDays) : '',
          changePercent,
          isCut: !prevIsSpecial && changePercent <= cutThreshold,
          isSpecial,
          remark: isSpecial ? '특별배당' : '',
        }
      })

    const yearlyTotals = history.reduce<Record<number, number>>((acc, record) => {
      if (!acc[record.year]) {
        acc[record.year] = 0
      }
      acc[record.year] += record.amount
      return acc
    }, {})
    const yearlyKeys = Object.keys(yearlyTotals)
      .map((year) => Number(year))
      .sort((a, b) => b - a)
    const latestYear = yearlyKeys[0]
    const prevYear = yearlyKeys[1]
    const dividendGrowthRate =
      latestYear && prevYear && yearlyTotals[prevYear] > 0
        ? ((yearlyTotals[latestYear] - yearlyTotals[prevYear]) / yearlyTotals[prevYear]) * 100
        : 0

    const payoutRatioFromEps =
      item.trailingEps && item.trailingEps > 0
        ? (annualDividend / item.trailingEps) * 100
        : 0
    const payoutRatioFromPe =
      item.trailingPE && item.trailingPE > 0 && item.regularMarketPrice && item.regularMarketPrice > 0
        ? ((annualDividend / item.regularMarketPrice) * item.trailingPE) * 100
        : 0
    const payoutRatio = payoutRatioFromEps || payoutRatioFromPe || 0

    const stock = {
      id: symbol,
      symbol,
      name: item.longName || item.shortName || symbol,
      currentPrice: toNumber(item.regularMarketPrice),
      dividendYield,
      annualDividend,
      quarterlyDividend: annualDividend ? Number((annualDividend / 4).toFixed(4)) : 0,
      exDividendDate: '',
      paymentDate: '',
      payoutRatio,
      dividendGrowthRate,
      sector: '기타',
      marketCap: formatMarketCap(item.marketCap),
      peRatio: toNumber(item.trailingPE),
      fiftyTwoWeekHigh: toNumber(item.fiftyTwoWeekHigh),
      fiftyTwoWeekLow: toNumber(item.fiftyTwoWeekLow),
    }

    return NextResponse.json({ stock, history })
  } catch (error) {
    return NextResponse.json(
      { error: 'Yahoo Finance 종목 정보를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}
