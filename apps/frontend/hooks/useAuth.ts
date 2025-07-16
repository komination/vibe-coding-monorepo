'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { authAtom } from '@/atoms/auth'
import { authApi } from '@/lib/api'
import { getAccessToken, clearTokens } from '@/lib/auth/tokens'
import { getCognitoLoginUrl, getCognitoLogoutUrl } from '@/lib/auth/config'

export function useAuth() {
  const router = useRouter()
  const [authState, setAuthState] = useAtom(authAtom)
  const queryClient = useQueryClient()

  const { data: userData, isLoading } = useQuery({
    queryKey: ['auth', 'profile'],
    queryFn: async () => {
      const token = getAccessToken()
      if (!token) return null
      
      try {
        const response = await authApi.getProfile()
        return response.data
      } catch (error) {
        clearTokens()
        return null
      }
    },
    retry: false,
    staleTime: 1000 * 60 * 5,
  })

  React.useEffect(() => {
    if (userData) {
      setAuthState({
        user: userData,
        token: getAccessToken(),
        isAuthenticated: true,
        isLoading: false,
      })
    } else if (!isLoading) {
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  }, [userData, isLoading, setAuthState])

  const login = React.useCallback(() => {
    window.location.href = getCognitoLoginUrl()
  }, [])

  const logout = useMutation({
    mutationFn: async () => {
      await authApi.logout()
      clearTokens()
    },
    onSuccess: () => {
      queryClient.clear()
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
      
      window.location.href = getCognitoLogoutUrl()
    },
  })

  return {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    isLoading: authState.isLoading || isLoading,
    login,
    logout: logout.mutate,
  }
}