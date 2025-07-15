'use client'

export interface TokenData {
  accessToken: string
  idToken: string
  refreshToken: string
  expiresIn: number
  tokenType: string
}

const TOKEN_KEY = 'kanban_auth_tokens'

export function saveTokens(tokens: TokenData): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({
      ...tokens,
      savedAt: Date.now(),
    }))
  }
}

export function getTokens(): TokenData | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  
  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export function getAccessToken(): string | null {
  const tokens = getTokens()
  return tokens?.accessToken || null
}

export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
  }
}

export function isTokenExpired(): boolean {
  const tokens = getTokens()
  if (!tokens) return true
  
  const { expiresIn, savedAt } = tokens as any
  if (!savedAt) return true
  
  const expiresAt = savedAt + (expiresIn * 1000)
  return Date.now() >= expiresAt
}