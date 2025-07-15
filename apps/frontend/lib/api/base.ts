export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

class BaseApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Add authentication header if token is available
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    // Get token from localStorage (only on client side)
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('kanban_auth_tokens')
      if (stored) {
        try {
          const tokens = JSON.parse(stored)
          if (tokens.accessToken) {
            headers.Authorization = `Bearer ${tokens.accessToken}`
          }
        } catch {
          // Ignore token parsing errors
        }
      }
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new ApiError(response.status, response.statusText, errorData)
    }

    return response.json()
  }

  protected async get<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: 'GET' })
  }

  protected async post<T>(
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  protected async put<T>(
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  protected async patch<T>(
    url: string,
    data?: any,
    options?: RequestInit
  ): Promise<T> {
    return this.request<T>(url, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  protected async delete<T>(url: string, options?: RequestInit): Promise<T> {
    return this.request<T>(url, { ...options, method: 'DELETE' })
  }
}

export const apiClient = new BaseApiClient('/api')
export default BaseApiClient