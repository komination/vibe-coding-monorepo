"use client"

import { useSession, signIn } from "next-auth/react"
import { useCallback } from "react"

export interface AuthenticatedSessionData {
  cognitoSub: string
  user?: {
    id?: string
    email?: string
    name?: string
    image?: string
  }
}

export interface AuthState {
  data: AuthenticatedSessionData | null
  status: "loading" | "authenticated" | "unauthenticated"
  isAuthenticated: boolean
  isLoading: boolean
  refresh: () => Promise<void>
  signInRequired: () => void
}

/**
 * Simplified authentication hook using NextAuth directly
 * Replaces the complex useAuthenticatedSession with minimal, functional implementation
 */
export function useAuth(): AuthState {
  const { data: session, status, update } = useSession()

  // Refresh session data
  const refresh = useCallback(async () => {
    try {
      await update()
    } catch (err) {
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

  // Prepare authenticated session data
  let authenticatedData: AuthenticatedSessionData | null = null
  
  if (status === "authenticated" && session?.cognitoSub) {
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

  return {
    data: authenticatedData,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    refresh,
    signInRequired,
  }
}

/**
 * Hook for components that require authentication
 * Automatically redirects to sign-in if not authenticated
 */
export function useRequireAuth(): AuthenticatedSessionData | null {
  const auth = useAuth()

  if (auth.status === "unauthenticated") {
    auth.signInRequired()
  }

  return auth.data
}

/**
 * Simple hook to get authenticated user data without redirects
 * Returns null if not authenticated
 */
export function useAuthenticatedUser() {
  const auth = useAuth()
  return auth.data?.user || null
}