'use client'

import { useEffect } from 'react'
import { Typography, Box, CircularProgress } from '@mui/material'
import { getCognitoLoginUrl } from '@/lib/auth/config'

export default function LoginPage() {
  useEffect(() => {
    // Redirect to Cognito Hosted UI
    window.location.href = getCognitoLoginUrl()
  }, [])

  return (
    <Box sx={{ textAlign: 'center' }}>
      <CircularProgress sx={{ mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        ログイン画面にリダイレクト中...
      </Typography>
      <Typography variant="body2" color="text.secondary">
        しばらくお待ちください
      </Typography>
    </Box>
  )
}