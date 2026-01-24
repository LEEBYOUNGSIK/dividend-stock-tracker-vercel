'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, DollarSign } from 'lucide-react'
import { mockCalendarEvents } from '@/lib/mock-data'
import type { CalendarEvent } from '@/lib/types'

const DAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

export function DividendCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2024, 1, 1)) // Feb 2024 for demo
  const [selectedDate, setSelectedDate] = useState<string | null>(null)

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const days = useMemo(() => {
    const result = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      result.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      result.push(i)
    }
    return result
  }, [firstDayOfMonth, daysInMonth])

  const getEventsForDate = (day: number): CalendarEvent[] => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return mockCalendarEvents.filter((event) => event.date === dateStr)
  }

  const selectedDateEvents = selectedDate
    ? mockCalendarEvents.filter((event) => event.date === selectedDate)
    : []

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
    setSelectedDate(null)
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
    setSelectedDate(null)
  }

  const handleDateClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(selectedDate === dateStr ? null : dateStr)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Calendar */}
      <Card className="border-border bg-card lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-foreground">
            {year}년 {MONTHS[month]}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {DAYS.map((day) => (
              <div key={day} className="py-2 text-sm font-medium text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />
              }

              const events = getEventsForDate(day)
              const hasExDividend = events.some((e) => e.type === 'ex-dividend')
              const hasPayment = events.some((e) => e.type === 'payment')
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
              const isSelected = selectedDate === dateStr

              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => handleDateClick(day)}
                  className={`relative aspect-square rounded-lg p-1 text-sm transition-colors ${
                    isSelected
                      ? 'bg-primary text-primary-foreground'
                      : events.length > 0
                      ? 'bg-secondary/50 text-foreground hover:bg-secondary'
                      : 'text-foreground hover:bg-secondary/30'
                  }`}
                >
                  <span className="block">{day}</span>
                  {events.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 flex -translate-x-1/2 gap-0.5">
                      {hasExDividend && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-destructive'}`} />
                      )}
                      {hasPayment && (
                        <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-primary-foreground' : 'bg-success'}`} />
                      )}
                    </div>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive" />
              <span className="text-muted-foreground">배당락일</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success" />
              <span className="text-muted-foreground">지급일</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Details */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CalendarIcon className="h-5 w-5" />
            {selectedDate ? selectedDate : '날짜를 선택하세요'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedDateEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {selectedDate ? '해당 날짜에 배당 이벤트가 없습니다111' : '캘린더에서 날짜를 선택하세요'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {selectedDateEvents.map((event, idx) => (
                <div key={`${event.date}-${event.type}-${idx}`} className="space-y-3">
                  <Badge variant={event.type === 'ex-dividend' ? 'destructive' : 'default'} className={event.type === 'payment' ? 'bg-success text-success-foreground' : ''}>
                    {event.type === 'ex-dividend' ? '배당락일' : '배당 지급일1'}
                  </Badge>
                  {event.stocks.map((stock) => (
                    <div
                      key={stock.symbol}
                      className="flex items-center justify-between rounded-lg bg-secondary/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                          <span className="text-xs font-bold text-primary-foreground">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{stock.symbol}</p>
                          <p className="text-xs text-muted-foreground">{stock.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-success">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">{stock.amount.toFixed(4)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
