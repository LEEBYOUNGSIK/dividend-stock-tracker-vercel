'use client'

import React from "react"

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Loader2, AlertCircle, Check } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const { register, loginWithGoogle } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }

    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)

    try {
      const result = await register(email, password, name)
      if (result.success) {
        if (result.needsEmailConfirmation) {
          setNotice('가입이 완료되었습니다. 이메일 인증을 완료한 뒤 로그인해주세요.')
        } else {
          router.push('/dashboard')
        }
      } else {
        setError(result.message ?? '회원가입 중 오류가 발생했습니다.')
      }
    } catch {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleRegister = async () => {
    setError('')
    setNotice('')
    setIsGoogleLoading(true)

    try {
      const result = await loginWithGoogle()
      if (!result.success) {
        setError(result.message ?? '구글 로그인 중 오류가 발생했습니다.')
      }
    } catch {
      setError('구글 로그인 중 오류가 발생했습니다.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  const passwordRequirements = [
    { text: '최소 6자 이상', met: password.length >= 6 },
    { text: '비밀번호 일치', met: password === confirmPassword && confirmPassword.length > 0 },
  ]

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="space-y-4 text-center">
          <Link href="/" className="mx-auto flex items-center justify-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <TrendingUp className="h-6 w-6 text-primary-foreground" />
            </div>
          </Link>
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">회원가입</CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">
              배당 TRACKER와 함께 스마트한 배당 투자를 시작하세요
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            {notice && (
              <div className="rounded-lg bg-primary/10 p-3 text-sm text-primary">
                {notice}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name" className="text-foreground">이름</Label>
              <Input
                id="name"
                type="text"
                placeholder="홍길동"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="bg-secondary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-secondary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-foreground">비밀번호</Label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-secondary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-foreground">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="비밀번호를 다시 입력하세요"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="bg-secondary/50 text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Password requirements */}
            <div className="space-y-2 rounded-lg bg-secondary/30 p-3">
              {passwordRequirements.map((req) => (
                <div key={req.text} className="flex items-center gap-2 text-sm">
                  <div
                    className={`flex h-4 w-4 items-center justify-center rounded-full ${
                      req.met ? 'bg-success' : 'bg-muted'
                    }`}
                  >
                    {req.met && <Check className="h-3 w-3 text-success-foreground" />}
                  </div>
                  <span className={req.met ? 'text-success' : 'text-muted-foreground'}>
                    {req.text}
                  </span>
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  가입 중...
                </>
              ) : (
                '회원가입'
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">또는</span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleRegister}
            disabled={isLoading || isGoogleLoading}
          >
            {isGoogleLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                구글 로그인 중...
              </>
            ) : (
              <>
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full bg-white"
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 48 48" className="h-4 w-4">
                    <path
                      fill="#FFC107"
                      d="M43.611 20.083H42V20H24v8h11.303C33.654 32.661 29.26 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.954 4 4 12.954 4 24s8.954 20 20 20 20-8.954 20-20c0-1.341-.138-2.651-.389-3.917z"
                    />
                    <path
                      fill="#FF3D00"
                      d="M6.306 14.691l6.571 4.818C14.657 16.108 19.009 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
                    />
                    <path
                      fill="#4CAF50"
                      d="M24 44c5.163 0 9.86-1.977 13.409-5.197l-6.191-5.238C29.148 35.091 26.715 36 24 36c-5.239 0-9.625-3.319-11.287-7.946l-6.523 5.025C9.505 39.556 16.227 44 24 44z"
                    />
                    <path
                      fill="#1976D2"
                      d="M43.611 20.083H42V20H24v8h11.303a12.07 12.07 0 0 1-4.085 5.565l.002-.001 6.191 5.238C36.964 39.289 44 34 44 24c0-1.341-.138-2.651-.389-3.917z"
                    />
                  </svg>
                </span>
                Google로 계속하기
              </>
            )}
          </Button>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            이미 계정이 있으신가요?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              로그인
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
