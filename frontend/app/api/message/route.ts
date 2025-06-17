import { NextResponse } from 'next/server'

const BACKEND_API_URL = 'http://localhost:3001'

export interface ApiMessage {
  message: string
  timestamp: string
  version: string
  metadata?: {
    "source": string
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/message`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data: ApiMessage = await response.json()
    data.metadata = {
      source: 'BFF API'}
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('BFF API error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch data from backend',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}