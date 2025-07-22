import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * PUT /api/boards/[id]/members/[userId] - Update member role
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(
    request,
    ["boards", resolvedParams.id, "members", resolvedParams.userId],
    {
      method: "PUT",
      requireAuth: true,
    }
  )
}

/**
 * DELETE /api/boards/[id]/members/[userId] - Remove member from board
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(
    request,
    ["boards", resolvedParams.id, "members", resolvedParams.userId],
    {
      method: "DELETE",
      requireAuth: true,
    }
  )
}