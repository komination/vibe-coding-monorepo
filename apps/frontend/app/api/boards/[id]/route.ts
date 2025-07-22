import { NextRequest } from "next/server"
import { handleApiRequest } from "@/lib/server/api"

/**
 * GET /api/boards/[id] - Get a specific board
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(request, ["boards", resolvedParams.id], {
    method: "GET",
    requireAuth: true,
  })
}

/**
 * PUT /api/boards/[id] - Update a board
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(request, ["boards", resolvedParams.id], {
    method: "PUT",
    requireAuth: true,
  })
}

/**
 * DELETE /api/boards/[id] - Delete a board
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  return handleApiRequest(request, ["boards", resolvedParams.id], {
    method: "DELETE",
    requireAuth: true,
  })
}