'use server'

import { revalidatePath, revalidateTag } from 'next/cache'
import { api } from '../server/api'
import { requireAuth } from '../server/auth'

// Re-export types from the API module
export interface Board {
  id: string
  title: string
  description?: string
  isPrivate: boolean
  backgroundUrl?: string
  ownerId: string
  createdAt: string
  updatedAt: string
  memberCount?: number
  listCount?: number
}

export interface CreateBoardRequest {
  title: string
  description?: string
  isPrivate?: boolean
  backgroundUrl?: string
}

export interface UpdateBoardRequest {
  title?: string
  description?: string
  isPrivate?: boolean
  backgroundUrl?: string
}

export interface BoardMember {
  id: string
  userId: string
  boardId: string
  role: "OWNER" | "ADMIN" | "MEMBER" | "VIEWER"
  joinedAt: string
  user: {
    id: string
    username: string
    name?: string
    avatarUrl?: string
  }
}

/**
 * Server Action to create a new board
 */
export async function createBoard(formData: FormData | CreateBoardRequest) {
  try {
    // Extract data from FormData or use object directly
    const data: CreateBoardRequest = formData instanceof FormData ? {
      title: formData.get('title') as string,
      description: formData.get('description') as string || undefined,
      isPrivate: formData.get('isPrivate') === 'true',
      backgroundUrl: formData.get('backgroundUrl') as string || undefined,
    } : formData

    // Validate required fields
    if (!data.title?.trim()) {
      throw new Error('Board title is required')
    }

    // Create board via API
    const result = await api.boards.create(data)

    if (result.error) {
      throw new Error(result.error)
    }

    // Revalidate boards list
    revalidatePath('/dashboard')
    revalidateTag('boards')

    // Return board data without redirect (client will handle navigation)
    return { success: true, board: result.data, boardId: result.data?.id }
  } catch (error) {
    console.error('Failed to create board:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to create board')
  }
}

/**
 * Server Action to update a board
 */
export async function updateBoard(boardId: string, formData: FormData | UpdateBoardRequest) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    // Extract data from FormData or use object directly
    const data: UpdateBoardRequest = formData instanceof FormData ? {
      title: formData.get('title') as string || undefined,
      description: formData.get('description') as string || undefined,
      isPrivate: formData.get('isPrivate') === 'true',
      backgroundUrl: formData.get('backgroundUrl') as string || undefined,
    } : formData

    // Update board via API
    const result = await api.boards.update(boardId, data)

    if (result.error) {
      throw new Error(result.error)
    }

    // Revalidate board data
    revalidatePath(`/boards/${boardId}`)
    revalidatePath('/dashboard')
    revalidateTag('boards')
    revalidateTag(`board-${boardId}`)

    return { success: true, board: result.data }
  } catch (error) {
    console.error('Failed to update board:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update board')
  }
}

/**
 * Server Action to delete a board
 */
export async function deleteBoard(boardId: string) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    // Delete board via API
    const result = await api.boards.delete(boardId)

    if (result.error) {
      throw new Error(result.error)
    }

    // Revalidate boards list
    revalidatePath('/dashboard')
    revalidateTag('boards')
    revalidateTag(`board-${boardId}`)

    return { success: true, message: 'Board deleted successfully' }
  } catch (error) {
    console.error('Failed to delete board:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to delete board')
  }
}

/**
 * Server Action to add a member to a board
 */
export async function addBoardMember(
  boardId: string, 
  formData: FormData | { email: string; role?: string }
) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    // Extract data from FormData or use object directly
    const data = formData instanceof FormData ? {
      email: formData.get('email') as string,
      role: formData.get('role') as string || 'MEMBER',
    } : formData

    // Validate email
    if (!data.email?.trim()) {
      throw new Error('Email is required')
    }

    // Add member via API
    const result = await api.boards.members.add(boardId, data)

    if (result.error) {
      throw new Error(result.error)
    }

    // Revalidate board members
    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}/members`)
    revalidateTag(`board-${boardId}-members`)

    return { success: true, member: result.data }
  } catch (error) {
    console.error('Failed to add board member:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to add member')
  }
}

/**
 * Server Action to update a member's role
 */
export async function updateMemberRole(
  boardId: string,
  userId: string,
  formData: FormData | { role: string }
) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    // Extract data from FormData or use object directly
    const data = formData instanceof FormData ? {
      role: formData.get('role') as string,
    } : formData

    // Validate role
    if (!data.role || !['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(data.role)) {
      throw new Error('Invalid role')
    }

    // Update member role via API
    const result = await api.boards.members.update(boardId, userId, data)

    if (result.error) {
      throw new Error(result.error)
    }

    // Revalidate board members
    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}/members`)
    revalidateTag(`board-${boardId}-members`)

    return { success: true, member: result.data }
  } catch (error) {
    console.error('Failed to update member role:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to update member role')
  }
}

/**
 * Server Action to remove a member from a board
 */
export async function removeBoardMember(boardId: string, userId: string) {
  try {
    // Ensure user is authenticated
    await requireAuth()

    // Remove member via API
    const result = await api.boards.members.remove(boardId, userId)

    if (result.error) {
      throw new Error(result.error)
    }

    // Revalidate board members
    revalidatePath(`/boards/${boardId}`)
    revalidatePath(`/boards/${boardId}/members`)
    revalidateTag(`board-${boardId}-members`)

    return { success: true, message: result.data?.message || 'Member removed' }
  } catch (error) {
    console.error('Failed to remove board member:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to remove member')
  }
}

/**
 * Utility function to get boards for Server Components
 * This is not a Server Action but a server-side data fetching function
 */
export async function getBoards(): Promise<Board[]> {
  try {
    const result = await api.boards.list()

    if (result.error) {
      console.error('Failed to fetch boards:', result.error)
      return []
    }

    // Backend returns {ownedBoards, memberBoards, totalCount}
    // We need to combine them into a single array
    if (result.data) {
      const data = result.data as { ownedBoards?: Board[], memberBoards?: Board[], totalCount?: number }
      const { ownedBoards = [], memberBoards = [] } = data
      return [...ownedBoards, ...memberBoards]
    }

    return []
  } catch (error) {
    console.error('Error fetching boards:', error)
    return []
  }
}

/**
 * Utility function to get a single board for Server Components
 */
export async function getBoard(boardId: string): Promise<Board | null> {
  try {
    // Ensure user is authenticated
    await requireAuth()

    const result = await api.boards.get(boardId)

    if (result.error) {
      console.error('Failed to fetch board:', result.error)
      return null
    }

    return result.data || null
  } catch (error) {
    console.error('Error fetching board:', error)
    return null
  }
}

/**
 * Utility function to get board members for Server Components
 */
export async function getBoardMembers(boardId: string): Promise<BoardMember[]> {
  try {
    // Ensure user is authenticated
    await requireAuth()

    const result = await api.boards.members.list(boardId)

    if (result.error) {
      console.error('Failed to fetch board members:', result.error)
      return []
    }

    return result.data || []
  } catch (error) {
    console.error('Error fetching board members:', error)
    return []
  }
}