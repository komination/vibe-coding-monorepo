import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { serverApi, api } from "./api"
import type { ReactElement } from "react"

export interface AuthenticatedSession {
  cognitoSub: string
  user?: {
    id: string
    email: string
    name: string
  }
}

/**
 * Get the current authenticated session for Server Components
 * Returns null if not authenticated
 */
export async function getSession(): Promise<AuthenticatedSession | null> {
  const session = await auth()
  
  if (!session?.cognitoSub) {
    return null
  }

  return {
    cognitoSub: session.cognitoSub,
    user: session.user ? {
      id: session.user.id || session.cognitoSub,
      email: session.user.email || '',
      name: session.user.name || '',
    } : undefined,
  }
}

/**
 * Require authentication for Server Components
 * Redirects to sign-in page if not authenticated
 */
export async function requireAuth(redirectTo?: string): Promise<AuthenticatedSession> {
  const session = await getSession()
  
  if (!session) {
    const signInUrl = redirectTo 
      ? `/signin?callbackUrl=${encodeURIComponent(redirectTo)}`
      : '/signin'
    redirect(signInUrl)
  }

  return session
}

/**
 * Get current user profile from the backend
 * Combines session data with backend user data
 */
export async function getCurrentUser() {
  const session = await getSession()
  if (!session) {
    return null
  }

  try {
    const result = await api.auth.profile()
    
    if (result.error || !result.data) {
      console.error('Failed to get user profile:', result.error)
      return {
        id: session.cognitoSub,
        email: session.user?.email || '',
        name: session.user?.name || '',
        cognitoSub: session.cognitoSub,
      }
    }

    return {
      ...result.data,
      cognitoSub: session.cognitoSub,
    }
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return {
      id: session.cognitoSub,
      email: session.user?.email || '',
      name: session.user?.name || '',
      cognitoSub: session.cognitoSub,
    }
  }
}

/**
 * Check if user has access to a specific board
 * Returns the user's role on the board or null if no access
 */
export async function getBoardAccess(boardId: string): Promise<{
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER'
  board: any
} | null> {
  try {
    const result = await serverApi(`/boards/${boardId}`)
    
    if (result.error || result.status === 403) {
      return null
    }

    // Board API should return the user's role in the response
    // This is a placeholder - adjust based on actual backend response
    return {
      role: result.data?.userRole || 'VIEWER',
      board: result.data,
    }
  } catch (error) {
    console.error('Error checking board access:', error)
    return null
  }
}

/**
 * Utility to handle authentication errors in Server Components
 * Logs the error and redirects to appropriate page
 */
export function handleAuthError(error: any, fallbackPath = '/signin') {
  console.error('Authentication error:', error)
  
  // If it's a token expiration error, redirect to sign-in
  if (error?.message?.includes('expired') || error?.status === 401) {
    redirect('/signin?error=session_expired')
  }
  
  // For other errors, redirect to fallback path
  redirect(fallbackPath)
}

/**
 * Server-side auth wrapper for pages that require authentication
 * Usage: export default withAuth(MyPage)
 */
export function withAuth<T extends any[]>(
  Component: (...args: T) => Promise<ReactElement>,
  options: {
    redirectTo?: string
    requireBoardAccess?: string
  } = {}
) {
  return async (...args: T): Promise<ReactElement> => {
    try {
      await requireAuth(options.redirectTo)
      
      // Check board access if required
      if (options.requireBoardAccess) {
        const access = await getBoardAccess(options.requireBoardAccess)
        if (!access) {
          redirect('/dashboard?error=access_denied')
        }
      }

      return Component(...args)
    } catch (error) {
      handleAuthError(error)
      // This won't be reached due to redirect, but TypeScript needs it
      throw error
    }
  }
}