import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

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
 * Automatically gets access token from NextAuth session
 */
export async function serverApi<T = any>(
  endpoint: string,
  options: Omit<ApiRequestOptions, 'accessToken'> = {}
): Promise<ApiResponse<T>> {
  const session = await auth()
  
  if (!session?.accessToken) {
    return {
      error: "No authentication session",
      status: 401,
    }
  }

  return backendApi<T>(endpoint, {
    ...options,
    accessToken: session.accessToken,
  })
}

/**
 * API Route handler for Next.js API Routes
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

    // Get session for authentication
    let accessToken: string | undefined
    if (requireAuth) {
      const session = await auth()
      if (!session?.accessToken) {
        return NextResponse.json(
          { error: "Authentication required" },
          { status: 401 }
        )
      }
      accessToken = session.accessToken
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

    // Make API call
    const result = await backendApi(endpoint, {
      method: method as ApiRequestOptions['method'],
      body,
      searchParams,
      accessToken,
    })

    // Return response
    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      )
    }

    return NextResponse.json(result.data, { status: result.status })
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
    me: () => serverApi<any>('/auth/me'),
    profile: () => serverApi<any>('/auth/profile'),
    updateProfile: (data: any) => serverApi<any>('/auth/profile', {
      method: 'PUT',
      body: data,
    }),
    logout: () => serverApi<any>('/auth/logout', { method: 'POST' }),
  },

  // Board operations
  boards: {
    list: () => serverApi<any[]>('/boards'),
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