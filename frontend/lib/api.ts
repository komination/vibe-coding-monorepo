const API_BASE_URL = 'http://localhost:3001'

export interface ApiMessage {
  message: string
  timestamp: string
  version: string
}

export async function fetchMessage(): Promise<ApiMessage> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/message`, {
      cache: 'no-store', // SSRのため、キャッシュを無効化
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Failed to fetch message:', error)
    throw error
  }
}