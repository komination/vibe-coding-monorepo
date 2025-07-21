import { auth } from "@/auth"
import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest("GET", request, resolvedParams.path)
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest("POST", request, resolvedParams.path)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest("PUT", request, resolvedParams.path)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params
  return handleRequest("DELETE", request, resolvedParams.path)
}

async function handleRequest(
  method: string,
  request: NextRequest,
  path: string[]
) {
  try {
    const session = await auth()
    
    // Build the backend URL
    const backendPath = path.join("/")
    const searchParams = request.nextUrl.searchParams.toString()
    const backendUrl = `${BACKEND_URL}/api/${backendPath}${
      searchParams ? `?${searchParams}` : ""
    }`

    // Prepare headers
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    }

    // Add authorization header if session exists
    if (session?.accessToken) {
      headers["Authorization"] = `Bearer ${session.accessToken}`
    }

    // Prepare body for POST/PUT requests
    let body: string | undefined
    if (method === "POST" || method === "PUT") {
      try {
        const bodyData = await request.json()
        body = JSON.stringify(bodyData)
      } catch {
        // Handle cases where there's no JSON body
        body = undefined
      }
    }

    // Make request to backend
    const response = await fetch(backendUrl, {
      method,
      headers,
      body,
    })

    // Handle non-JSON responses
    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      const data = await response.json()
      return NextResponse.json(data, { status: response.status })
    } else {
      const text = await response.text()
      return new NextResponse(text, { status: response.status })
    }
  } catch (error) {
    console.error("API proxy error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}