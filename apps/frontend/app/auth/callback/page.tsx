'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Box, CircularProgress, Typography, Alert } from '@mui/material'
import { saveTokens } from '@/lib/auth/tokens'
import { cognitoConfig } from '@/lib/auth/config'

function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code')
      const error = searchParams.get('error')

      if (error) {
        setError(`認証エラー: ${error}`)
        return
      }

      if (!code) {
        setError('認証コードが見つかりません')
        return
      }

      try {
        // Exchange authorization code for tokens
        const tokenResponse = await fetch(`https://${cognitoConfig.oauth.domain}.auth.${cognitoConfig.region}.amazoncognito.com/oauth2/token`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: cognitoConfig.userPoolWebClientId,
            code: code,
            redirect_uri: cognitoConfig.oauth.redirectSignIn,
          }),
        })

        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json()
          throw new Error(errorData.error_description || 'Token exchange failed')
        }

        const tokens = await tokenResponse.json()
        
        // Save tokens to localStorage
        saveTokens({
          accessToken: tokens.access_token,
          idToken: tokens.id_token,
          refreshToken: tokens.refresh_token,
          expiresIn: tokens.expires_in,
          tokenType: tokens.token_type,
        })

        // Redirect to dashboard
        router.push('/dashboard')
      } catch (err) {
        console.error('Token exchange error:', err)
        setError(err instanceof Error ? err.message : '認証処理中にエラーが発生しました')
      }
    }

    handleCallback()
  }, [searchParams, router])

  if (error) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          p: 3,
        }}
      >
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          ログインページに戻って再度お試しください
        </Typography>
      </Box>
    )
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 2,
      }}
    >
      <CircularProgress size={48} />
      <Typography variant="h6">
        認証中...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        しばらくお待ちください
      </Typography>
    </Box>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: 2,
        }}
      >
        <CircularProgress size={48} />
        <Typography variant="h6">
          読み込み中...
        </Typography>
      </Box>
    }>
      <CallbackHandler />
    </Suspense>
  )
}