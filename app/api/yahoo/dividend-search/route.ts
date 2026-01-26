import { NextResponse } from 'next/server'

const YAHOO_SEARCH_URLS = [
  'https://query1.finance.yahoo.com/v1/finance/search',
  'https://query2.finance.yahoo.com/v1/finance/search',
]
const YAHOO_QUOTE_URLS = [
  'https://query1.finance.yahoo.com/v7/finance/quote',
  'https://query2.finance.yahoo.com/v7/finance/quote',
]
const YAHOO_CRUMB_URLS = [
  'https://query1.finance.yahoo.com/v1/test/getcrumb',
  'https://query2.finance.yahoo.com/v1/test/getcrumb',
]
const YAHOO_COOKIE_URL = 'https://fc.yahoo.com'

type YahooSearchQuote = {
  symbol?: string
  shortname?: string
  longname?: string
  quoteType?: string
  typeDisp?: string
}

type YahooQuote = {
  symbol?: string
  shortName?: string
  longName?: string
  regularMarketPrice?: number
  dividendYield?: number
  dividendRate?: number
  marketCap?: number
  trailingPE?: number
  fiftyTwoWeekHigh?: number
  fiftyTwoWeekLow?: number
}

const toNumber = (value?: number, fallback = 0) =>
  typeof value === 'number' ? value : fallback

const toPercent = (value?: number) => {
  if (typeof value !== 'number') {
    return 0
  }

  return value <= 1 ? value * 100 : value
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

const fetchYahooJson = async (urls: string[]) => {
  let lastError: YahooFetchError | null = null

  for (const url of urls) {
    const response = await fetch(url, {
      headers: createYahooHeaders(),
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

const fetchYahooJsonWithAuth = async (urls: string[], auth: YahooAuth) => {
  let lastError: YahooFetchError | null = null

  for (const url of urls) {
    const response = await fetch(url, {
      headers: {
        ...createYahooHeaders(),
        Cookie: auth.cookie,
      },
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
  const query = searchParams.get('query')?.trim()

  if (!query) {
    return NextResponse.json({ error: '검색어가 필요합니다.' }, { status: 400 })
  }

  try {
    const auth = await fetchYahooAuth()
    const searchUrls = YAHOO_SEARCH_URLS.map(
      (base) =>
        `${base}?q=${encodeURIComponent(query)}&quotesCount=6&newsCount=0&listsCount=0${
          auth?.crumb ? `&crumb=${encodeURIComponent(auth.crumb)}` : ''
        }`,
    )
    const searchResult = auth
      ? await fetchYahooJsonWithAuth(searchUrls, auth)
      : await fetchYahooJson(searchUrls)

    if (!searchResult.ok) {
      return NextResponse.json(
        { error: 'Yahoo Finance 검색에 실패했습니다.', detail: searchResult.error },
        { status: 502 },
      )
    }

    const searchData = searchResult.data
    const quotes: YahooSearchQuote[] = searchData?.quotes ?? []

    const symbols = quotes
      .filter((quote) => quote?.symbol)
      .filter((quote) => {
        const quoteType = quote?.quoteType?.toUpperCase()
        const typeDisp = quote?.typeDisp?.toUpperCase()
        const allowedTypes = ['EQUITY', 'ETF', 'ETN', 'CEF', 'MUTUALFUND', 'FUND']
        return allowedTypes.includes(quoteType ?? '') || allowedTypes.includes(typeDisp ?? '')
      })
      .slice(0, 5)

    if (symbols.length === 0) {
      return NextResponse.json({ results: [] })
    }

    const symbolList = symbols.map((quote) => quote.symbol).join(',')
    const quoteUrls = YAHOO_QUOTE_URLS.map(
      (base) =>
        `${base}?symbols=${encodeURIComponent(symbolList)}${
          auth?.crumb ? `&crumb=${encodeURIComponent(auth.crumb)}` : ''
        }`,
    )
    const quoteResult = auth
      ? await fetchYahooJsonWithAuth(quoteUrls, auth)
      : await fetchYahooJson(quoteUrls)

    if (!quoteResult.ok) {
      return NextResponse.json(
        { error: 'Yahoo Finance 상세 데이터에 실패했습니다.', detail: quoteResult.error },
        { status: 502 },
      )
    }

    const quoteData = quoteResult.data
    const quoteResults: YahooQuote[] = quoteData?.quoteResponse?.result ?? []

    const results = quoteResults
      .filter((item) => item?.symbol)
      .map((item) => {
        const annualDividend = toNumber(item.dividendRate)
        const dividendYield = toPercent(item.dividendYield)

        return {
          id: item.symbol as string,
          symbol: item.symbol as string,
          name: item.longName || item.shortName || item.symbol,
          currentPrice: toNumber(item.regularMarketPrice),
          dividendYield,
          annualDividend,
          quarterlyDividend: annualDividend ? Number((annualDividend / 4).toFixed(4)) : 0,
          exDividendDate: '',
          paymentDate: '',
          payoutRatio: 0,
          dividendGrowthRate: 0,
          sector: '기타',
          marketCap: formatMarketCap(item.marketCap),
          peRatio: toNumber(item.trailingPE),
          fiftyTwoWeekHigh: toNumber(item.fiftyTwoWeekHigh),
          fiftyTwoWeekLow: toNumber(item.fiftyTwoWeekLow),
        }
      })

    return NextResponse.json({ results })
  } catch (error) {
    return NextResponse.json(
      { error: 'Yahoo Finance 배당 정보를 불러오지 못했습니다.' },
      { status: 500 },
    )
  }
}
