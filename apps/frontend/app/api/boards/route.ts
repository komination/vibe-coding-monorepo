import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * GET /api/boards - Get user's boards
 */
export async function GET(request: NextRequest) {
  return handleApiRequest(request, ["boards"], {
    method: "GET",
    requireAuth: true,
  })
}

/**
 * POST /api/boards - Create a new board
 */
export async function POST(request: NextRequest) {
  return handleApiRequest(request, ["boards"], {
    method: "POST",
    requireAuth: true,
  })
}