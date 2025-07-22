import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * GET /api/auth/profile - Get user profile
 */
export async function GET(request: NextRequest) {
  return handleApiRequest(request, ["auth", "profile"], {
    method: "GET",
    requireAuth: true,
  })
}

/**
 * PUT /api/auth/profile - Update user profile
 */
export async function PUT(request: NextRequest) {
  return handleApiRequest(request, ["auth", "profile"], {
    method: "PUT",
    requireAuth: true,
  })
}