"use client"

import { Alert, Button, Box, Snackbar } from "@mui/material"
import { useState, useEffect } from "react"
import { useAuthenticatedSession } from "@/lib/auth/useAuthenticatedSession"

interface AuthenticationAlertProps {
  onReauthenticate?: () => void
}

export function AuthenticationAlert({ onReauthenticate }: AuthenticationAlertProps) {
  const { status, error, isTokenExpired, signInRequired, refresh } = useAuthenticatedSession()
  const [showAlert, setShowAlert] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Show alert when there's an authentication error or token is expired
  useEffect(() => {
    if (status === "error" || isTokenExpired || error) {
      setShowAlert(true)
    } else {
      setShowAlert(false)
    }
  }, [status, isTokenExpired, error])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refresh()
      // If refresh succeeds, the alert will automatically hide due to useEffect
    } catch (err) {
      console.error("Failed to refresh session:", err)
      // Keep showing the alert if refresh fails
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleSignIn = () => {
    if (onReauthenticate) {
      onReauthenticate()
    } else {
      signInRequired()
    }
  }

  const handleClose = () => {
    setShowAlert(false)
  }

  if (!showAlert) {
    return null
  }

  return (
    <Snackbar
      open={showAlert}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ mt: 8 }} // Add margin to avoid covering the header
    >
      <Alert
        severity="warning"
        onClose={handleClose}
        sx={{ minWidth: "400px" }}
        action={
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button
              color="inherit"
              size="small"
              onClick={handleSignIn}
              variant="outlined"
            >
              Sign In
            </Button>
          </Box>
        }
      >
        {error || "Your session has expired. Please refresh or sign in again."}
      </Alert>
    </Snackbar>
  )
}

/**
 * Inline authentication error component for use within forms or components
 */
export function InlineAuthError() {
  const { status, error, isTokenExpired, signInRequired } = useAuthenticatedSession()

  if (status !== "error" && !isTokenExpired && !error) {
    return null
  }

  return (
    <Alert
      severity="error"
      action={
        <Button color="inherit" size="small" onClick={signInRequired}>
          Sign In
        </Button>
      }
      sx={{ mb: 2 }}
    >
      {error || "Authentication required. Please sign in to continue."}
    </Alert>
  )
}