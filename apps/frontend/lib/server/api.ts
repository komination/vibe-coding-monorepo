import { NextRequest, NextResponse } from "next/server"
import { unstable_noStore as noStore } from "next/cache"
import { getToken } from "next-auth/jwt"
import { cookies } from "next/headers"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: any
  headers?: Record<string, string>
  searchParams?: URLSearchParams | Record<string, string>
  accessToken?: string
}

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  status: number
}

/**
 * Core API function for both Server Components and API Routes
 * Handles authentication, request preparation, and response parsing
 */
export async function backendApi<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  try {
    const {
      method = 'GET',
      body,
      headers: customHeaders = {},
      searchParams,
      accessToken
    } = options

    // Build URL with search params
    const url = new URL(`/api${endpoint}`, BACKEND_URL)
    if (searchParams) {
      const params = searchParams instanceof URLSearchParams 
        ? searchParams 
        : new URLSearchParams(searchParams)
      params.forEach((value, key) => url.searchParams.set(key, value))
    }

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders,
    }

    // Add authorization if token provided
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`
    }
    // Prepare body for POST/PUT requests
    const requestBody = (method === "POST" || method === "PUT") && body
      ? JSON.stringify(body)
      : undefined
    // Make request to backend
    const response = await fetch(url.toString(), {
      method,
      headers,
      body: requestBody,
    })

    // Parse response
    const contentType = response.headers.get("content-type")
    let data: T
    
    if (contentType?.includes("application/json")) {
      data = await response.json()
    } else {
      data = (await response.text()) as T
    }

    return {
      data,
      status: response.status,
    }
  } catch (error) {
    console.error("Backend API error:", error)
    return {
      error: error instanceof Error ? error.message : "API request failed",
      status: 500,
    }
  }
}

/**
 * Authenticated API call for Server Components
 * Automatically gets access token from NextAuth JWT with token refresh retry
 */
export async function serverApi<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'accessToken'> = {}
): Promise<ApiResponse<T>> {
  // Disable caching to ensure we get fresh session
  noStore()
  
  // Create a minimal request object from headers for getToken
  const cookieStore = await cookies()
  const req = {
    cookies: {
      get: (name: string) => {
        const cookie = cookieStore.get(name)
        return cookie ? { name: cookie.name, value: cookie.value } : undefined
      }
    },
    headers: new Headers({
      cookie: cookieStore.toString()
    })
  }
  
  const token = await getToken({ 
    req,
    secret: process.env.NEXTAUTH_SECRET
  })
  
  if (!token?.accessToken) {
    return {
      error: "No authentication session",
      status: 401,
    }
  }

  // First attempt with current session token
  const firstAttempt = await backendApi<T>(endpoint, {
    ...options,
    accessToken: token.accessToken as string,
  })

  // If first attempt fails with 401, try to refresh token and retry
  if (firstAttempt.status === 401) {    
    // Force NextAuth to refresh the session
    // The noStore() ensures we bypass any caching
    noStore()
    const refreshedToken = await getToken({ 
      req,
      secret: process.env.NEXTAUTH_SECRET
    })
    
    if (!refreshedToken?.accessToken || refreshedToken.accessToken === token.accessToken) {
      // If we still don't have a token or it's the same token, authentication failed
      return {
        error: "Authentication session expired",
        status: 401,
      }
    }    
    // Retry with refreshed token
    const retryAttempt = await backendApi<T>(endpoint, {
      ...options,
      accessToken: refreshedToken.accessToken as string,
    })

    // If retry also fails with 401, the refresh didn't work
    if (retryAttempt.status === 401) {
      return {
        error: "Authentication failed after token refresh",
        status: 401,
      }
    }

    return retryAttempt
  }

  return firstAttempt
}

/**
 * API Route handler for Next.js API Routes with token refresh retry
 * Extracts path and handles request/response for BFF patterns
 */
export async function handleApiRequest(
  request: NextRequest,
  path: string[],
  options: {
    method?: string
    requireAuth?: boolean
  } = {}
): Promise<NextResponse> {
  try {
    const method = options.method || request.method
    const requireAuth = options.requireAuth ?? true

    // Get token for authentication
    let accessToken: string | undefined
    if (requireAuth) {
      const token = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })
      if (!token?.accessToken) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
      accessToken = token.accessToken as string
    }

    // Build endpoint from path
    const endpoint = `/${path.join("/")}`
    
    // Extract search params
    const searchParams = request.nextUrl.searchParams

    // Extract body for POST/PUT requests
    let body: any
    if (method === "POST" || method === "PUT") {
      try {
        body = await request.json()
      } catch {
        // Handle cases where there's no JSON body
        body = undefined
      }
    }

    // First attempt with current session token
    const firstAttempt = await backendApi(endpoint, {
      method: method as ApiRequestOptions['method'],
      body,
      searchParams,
      accessToken,
    })

    // If first attempt fails with 401 and auth is required, try to refresh token and retry
    if (firstAttempt.status === 401 && requireAuth && accessToken) {
      
      // Get fresh token (which should trigger token refresh in NextAuth)
      const refreshedToken = await getToken({ 
        req: request,
        secret: process.env.NEXTAUTH_SECRET
      })
      
      if (!refreshedToken?.accessToken || refreshedToken.accessToken === accessToken) {
        // If we still don't have a token or it's the same token, authentication failed
        return NextResponse.json(
          { error: "Authentication session expired" },
          { status: 401 }
        )
      }

      // Retry with refreshed token
      const retryAttempt = await backendApi(endpoint, {
        method: method as ApiRequestOptions['method'],
        body,
        searchParams,
        accessToken: refreshedToken.accessToken as string,
      })

      // Return retry result (even if it fails)
      if (retryAttempt.error) {
        return NextResponse.json(
          { error: retryAttempt.error },
          { status: retryAttempt.status }
        )
      }

      return NextResponse.json(retryAttempt.data, { status: retryAttempt.status })
    }

    // Return first attempt response
    if (firstAttempt.error) {
      return NextResponse.json(
        { error: firstAttempt.error },
        { status: firstAttempt.status }
      )
    }

    return NextResponse.json(firstAttempt.data, { status: firstAttempt.status })
  } catch (error) {
    console.error("API route handler error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

/**
 * Type-safe API functions for common operations
 */
export const api = {
  // Auth operations
  auth: {
    profile: () => serverApi<any>('/auth/profile'),
    updateProfile: (data: any) => serverApi<any>('/auth/profile', {
      method: 'PUT',
      body: data,
    }),
    logout: () => serverApi<any>('/auth/logout', { method: 'POST' }),
  },

  // Board operations
  boards: {
    list: () => serverApi<{ownedBoards: any[], memberBoards: any[], totalCount: number}>('/boards'),
    get: (id: string) => serverApi<any>(`/boards/${id}`),
    create: (data: any) => serverApi<any>('/boards', {
      method: 'POST',
      body: data,
    }),
    update: (id: string, data: any) => serverApi<any>(`/boards/${id}`, {
      method: 'PUT',
      body: data,
    }),
    delete: (id: string) => serverApi<any>(`/boards/${id}`, {
      method: 'DELETE',
    }),
    members: {
      list: (boardId: string) => serverApi<any[]>(`/boards/${boardId}/members`),
      add: (boardId: string, data: any) => serverApi<any>(`/boards/${boardId}/members`, {
        method: 'POST',
        body: data,
      }),
      update: (boardId: string, userId: string, data: any) => 
        serverApi<any>(`/boards/${boardId}/members/${userId}`, {
          method: 'PUT',
          body: data,
        }),
      remove: (boardId: string, userId: string) => 
        serverApi<any>(`/boards/${boardId}/members/${userId}`, {
          method: 'DELETE',
        }),
    },
  },
}