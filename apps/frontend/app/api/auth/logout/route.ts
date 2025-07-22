import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * POST /api/auth/logout - Logout user
 */
export async function POST(request: NextRequest) {
  return handleApiRequest(request, ["auth", "logout"], {
    method: "POST",
    requireAuth: true,
  })
}