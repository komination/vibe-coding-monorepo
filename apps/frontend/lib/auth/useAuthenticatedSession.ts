"use client"

import { useSession, signIn } from "next-auth/react"
import { useEffect, useState, useCallback } from "react"

export interface AuthenticatedSessionData {
  cognitoSub: string
  user?: {
    id?: string
    email?: string
    name?: string
    image?: string
  }
}

export interface AuthSessionState {
  data: AuthenticatedSessionData | null
  status: "loading" | "authenticated" | "unauthenticated" | "error"
  error: string | null
  isTokenExpired: boolean
  refresh: () => Promise<void>
  signInRequired: () => void
}

/**
 * Enhanced session hook with automatic token expiration detection
 * and improved error handling for client-side components
 */
export function useAuthenticatedSession(): AuthSessionState {
  const { data: session, status, update } = useSession()
  const [error, setError] = useState<string | null>(null)
  const [isTokenExpired, setIsTokenExpired] = useState(false)

  // Check if session is expired
  const checkTokenExpiration = useCallback(() => {
    // Since tokens are server-side only, we rely on API responses
    // to determine if the session is expired
    return false
  }, [])

  // Refresh session data
  const refresh = useCallback(async () => {
    try {
      setError(null)
      await update()
    } catch (err) {
      setError("Failed to refresh session. Please try again.")
      console.error("Session refresh error:", err)
    }
  }, [update])

  // Trigger sign-in flow
  const signInRequired = useCallback(() => {
    const currentUrl = window.location.pathname + window.location.search
    signIn("cognito", { 
      callbackUrl: currentUrl,
      redirect: true 
    })
  }, [])

  // Session status monitoring
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Session is valid
      setIsTokenExpired(false)
    }
  }, [session, status])

  // Handle session expiration from API responses
  useEffect(() => {
    // Listen for custom events from API calls that indicate token expiration
    const handleTokenExpired = () => {
      setIsTokenExpired(true)
      setError("Your session has expired. Please sign in again.")
    }

    window.addEventListener('auth:token-expired', handleTokenExpired)
    return () => window.removeEventListener('auth:token-expired', handleTokenExpired)
  }, [])

  // Handle authentication errors
  useEffect(() => {
    if (status === "unauthenticated") {
      setError("Authentication required")
      setIsTokenExpired(false)
    } else if (status === "authenticated") {
      setError(null)
    }
  }, [status])

  // Prepare authenticated session data
  let authenticatedData: AuthenticatedSessionData | null = null
  
  if (status === "authenticated" && session?.cognitoSub && !isTokenExpired) {
    authenticatedData = {
      cognitoSub: session.cognitoSub,
      user: session.user ? {
        id: session.user.id,
        email: session.user.email || undefined,
        name: session.user.name || undefined,
        image: session.user.image || undefined,
      } : undefined,
    }
  }

  // Determine final status
  let finalStatus: AuthSessionState["status"] = status
  if (status === "authenticated" && isTokenExpired) {
    finalStatus = "error"
  }

  return {
    data: authenticatedData,
    status: finalStatus,
    error,
    isTokenExpired,
    refresh,
    signInRequired,
  }
}

/**
 * Hook for components that require authentication
 * Automatically redirects to sign-in if not authenticated
 */
export function useRequireAuth(): AuthenticatedSessionData | null {
  const auth = useAuthenticatedSession()

  useEffect(() => {
    if (auth.status === "unauthenticated" || (auth.status === "error" && auth.isTokenExpired)) {
      auth.signInRequired()
    }
  }, [auth.status, auth.isTokenExpired, auth.signInRequired])

  return auth.data
}

/**
 * Simple hook to get authenticated user data without redirects
 * Returns null if not authenticated
 */
export function useAuthenticatedUser() {
  const auth = useAuthenticatedSession()
  return auth.data?.user || null
}