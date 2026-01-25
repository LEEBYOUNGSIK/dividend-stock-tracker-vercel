'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { TrendingUp, Calendar, User, LogOut, Eye, EyeClosed, Menu, X } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()
  const [isDark, setIsDark] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark)
    setIsDark(shouldBeDark)
    document.documentElement.classList.toggle('dark', shouldBeDark)
  }, [])

  const toggleTheme = () => {
    const newIsDark = !isDark
    setIsDark(newIsDark)
    document.documentElement.classList.toggle('dark', newIsDark)
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">배당 TRACKER</span>
          </Link>
          
          {user && (
            <nav className="hidden items-center gap-1 md:flex">
              <Link href="/dashboard">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  대시보드
                </Button>
              </Link>
              <Link href="/calendar">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                  <Calendar className="mr-2 h-4 w-4" />
                  배당 캘린더
                </Button>
              </Link>
            </nav>
          )}
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

          {user ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden gap-2 md:flex">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                      <User className="h-4 w-4 text-secondary-foreground" />
                    </div>
                    <span className="text-foreground">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-muted-foreground">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">로그인</Button>
              </Link>
              <Link href="/register">
                <Button>회원가입</Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {user && isMobileMenuOpen && (
        <div className="border-t border-border bg-card px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                대시보드
              </Button>
            </Link>
            <Link href="/calendar" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-foreground">
                <Calendar className="mr-2 h-4 w-4" />
                배당 캘린더
              </Button>
            </Link>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive"
              onClick={() => {
                logout()
                setIsMobileMenuOpen(false)
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              로그아웃
            </Button>
          </nav>
        </div>
      )}
    </header>
  )
}
