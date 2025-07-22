import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * GET /api/auth/me - Get current user profile
 */
export async function GET(request: NextRequest) {
  return handleApiRequest(request, ["auth", "me"], {
    method: "GET",
    requireAuth: true,
  })
}