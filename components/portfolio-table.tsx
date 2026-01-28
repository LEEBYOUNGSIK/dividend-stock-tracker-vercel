'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Trash2, ExternalLink, TrendingUp } from 'lucide-react'

export function PortfolioTable() {
  const { portfolio, removeFromPortfolio } = useAuth()

  if (portfolio.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card py-16">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">포트폴리오가 비어있습니다</h3>
        <p className="mt-1 text-muted-foreground">위 검색창에서 배당주를 추가해보세요</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <Table className="w-full">
        <TableHeader className="bg-muted/20">
          <TableRow className="border-b border-border/60 hover:bg-transparent">
            <TableHead className="text-muted-foreground">종목</TableHead>
            <TableHead className="text-right text-muted-foreground">보유수량</TableHead>
            <TableHead className="text-right text-muted-foreground">현재가</TableHead>
            <TableHead className="text-right text-muted-foreground">평가금액</TableHead>
            <TableHead className="text-right text-muted-foreground">배당수익률</TableHead>
            <TableHead className="text-right text-muted-foreground">연간배당금</TableHead>
            <TableHead className="w-10"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {portfolio.map((stock) => {
            return (
              <TableRow
                key={stock.id}
                className="border-b border-border/60 bg-card hover:bg-muted/30 even:bg-muted/20"
              >
                <TableCell className="py-2">
                  <Link href={`/stock/${stock.symbol}`} className="flex items-center gap-3 hover:opacity-80">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                      <span className="text-xs font-bold text-secondary-foreground">
                        {stock.symbol.slice(0, 2)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">{stock.symbol}</span>
                        <Badge variant="secondary" className="text-xs">
                          {stock.sector}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{stock.name}</p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="py-2 text-right font-medium text-foreground">
                  {stock.shares.toLocaleString()}주
                </TableCell>
                <TableCell className="py-2 text-right font-medium text-foreground">
                  ${stock.currentPrice.toFixed(2)}
                </TableCell>
                <TableCell className="py-2 text-right font-medium text-foreground">
                  ${stock.totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className="py-2 text-right">
                  <span className={`font-medium ${stock.dividendYield >= 3 ? 'text-success' : 'text-foreground'}`}>
                    {stock.dividendYield.toFixed(2)}%
                  </span>
                </TableCell>
                <TableCell className="py-2 text-right font-medium text-success">
                  ${stock.totalDividend.toFixed(2)}
                </TableCell>
                <TableCell className="py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/stock/${stock.symbol}`}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          상세 정보
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => removeFromPortfolio(stock.symbol)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
