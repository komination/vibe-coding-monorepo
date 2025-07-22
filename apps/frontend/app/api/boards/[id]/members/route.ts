import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * GET /api/boards/[id]/members - Get board members
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(request, ["boards", resolvedParams.id, "members"], {
    method: "GET",
    requireAuth: true,
  })
}

/**
 * POST /api/boards/[id]/members - Add a member to board
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(request, ["boards", resolvedParams.id, "members"], {
    method: "POST",
    requireAuth: true,
  })
}