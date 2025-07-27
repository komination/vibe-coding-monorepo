'use server'

import { revalidatePath } from 'next/cache'
import { api } from '../server/api'

export interface UpdateProfileRequest {
  name?: string
  avatarUrl?: string
}

export interface ProfileData {
  id: string
  username: string
  name?: string
  email: string
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * Server Action to get user profile
 */
export async function getProfile(): Promise<ProfileData | null> {
  try {
    const result = await api.auth.profile()

    if (result.error) {
      console.error('Failed to fetch profile:', result.error)
      throw new Error(result.error)
    }

    return result.data || null
  } catch (error) {
    console.error('Error fetching profile:', error)
    throw new Error(error instanceof Error ? error.message : 'Failed to fetch profile')
  }
}

/**
 * Server Action to update user profile
 */
export async function updateProfile(data: UpdateProfileRequest) {
  try {    
    // Validate at least one field is being updated
    if (!data.name && !data.avatarUrl) {
      throw new Error('No fields to update')
    }

    // Update profile via API
    const result = await api.auth.updateProfile(data)

    if (result.error) {
      console.error('API error response:', result)
      // Check if it's an authentication error
      if (result.status === 401) {
        throw new Error('Authentication session expired')
      }
      throw new Error(result.error)
    }
    
    if (!result.data) {
      console.error('No data in API response:', result)
      throw new Error('No data received from server')
    }

    // Revalidate profile page
    revalidatePath('/profile')

    return { success: true, profile: result.data }
  } catch (error) {
    console.error('Failed to update profile:', error)
    // Re-throw the error to preserve the original error message
    throw error
  }
}