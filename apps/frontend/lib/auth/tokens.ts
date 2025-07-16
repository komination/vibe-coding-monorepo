'use client'

const TOKEN_KEY = 'kanban_auth_tokens'

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  
  const stored = localStorage.getItem(TOKEN_KEY)
  if (!stored) return null
  
  try {
    const tokens = JSON.parse(stored)
    return tokens.accessToken || null
  } catch {
    return null
  }
}

export function saveTokens(accessToken: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, JSON.stringify({
      accessToken,
      savedAt: Date.now(),
    }))
  }
}

export function clearTokens(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem('mock_user')
  }
}