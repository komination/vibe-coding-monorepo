export interface ApiError {
  error: string
  details?: any
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export type CreateAsyncState<T> = () => AsyncState<T>

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface ToastMessage {
  id: string
  type: "success" | "error" | "warning" | "info"
  message: string
  duration?: number
}