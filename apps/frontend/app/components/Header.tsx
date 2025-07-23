"use client"

import { useState } from "react"
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Box,
  Chip,
} from "@mui/material"
import { signOut } from "next-auth/react"
import { useAuthenticatedSession } from "@/lib/auth/useAuthenticatedSession"
import Link from "next/link"
import AccountCircleIcon from "@mui/icons-material/AccountCircle"
import LogoutIcon from "@mui/icons-material/Logout"
import DashboardIcon from "@mui/icons-material/Dashboard"
import WarningIcon from "@mui/icons-material/Warning"

export function Header() {
  const { data: authenticatedSession, status, isTokenExpired, signInRequired } = useAuthenticatedSession()
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleSignOut = async () => {
    handleMenuClose()
    await signOut({ callbackUrl: "/" })
  }

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          href="/dashboard"
          sx={{
            flexGrow: 1,
            textDecoration: "none",
            color: "inherit",
            fontWeight: 600,
          }}
        >
          Kanban
        </Typography>

        <Button
          component={Link}
          href="/dashboard"
          color="inherit"
          startIcon={<DashboardIcon />}
          sx={{ mr: 2 }}
        >
          Dashboard
        </Button>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Show session status indicator */}
          {isTokenExpired && (
            <Chip
              icon={<WarningIcon />}
              label="Session Expired"
              color="warning"
              size="small"
              onClick={signInRequired}
              sx={{ cursor: "pointer" }}
            />
          )}
          
          {status === "loading" && (
            <Chip label="Loading..." size="small" />
          )}

          {authenticatedSession?.user ? (
            <Box>
              <IconButton
                onClick={handleMenuOpen}
                size="small"
                sx={{ ml: 2 }}
                aria-controls={anchorEl ? "account-menu" : undefined}
                aria-haspopup="true"
                aria-expanded={anchorEl ? "true" : undefined}
              >
                <Avatar
                  src={authenticatedSession.user.image || undefined}
                  alt={(authenticatedSession.user.name && typeof authenticatedSession.user.name === 'string' ? authenticatedSession.user.name : '') || (authenticatedSession.user.email && typeof authenticatedSession.user.email === 'string' ? authenticatedSession.user.email : '') || "User"}
                  sx={{ 
                    width: 32, 
                    height: 32,
                    border: isTokenExpired ? "2px solid orange" : "none"
                  }}
                >
                  {(authenticatedSession.user.name && typeof authenticatedSession.user.name === 'string' ? authenticatedSession.user.name.charAt(0).toUpperCase() : '') || (authenticatedSession.user.email && typeof authenticatedSession.user.email === 'string' ? authenticatedSession.user.email.charAt(0).toUpperCase() : '') || "U"}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={Boolean(anchorEl)}
                onClose={handleMenuClose}
                onClick={handleMenuClose}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem component={Link} href="/profile" onClick={handleMenuClose}>
                  <AccountCircleIcon sx={{ mr: 1 }} />
                  Profile
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Sign Out
                </MenuItem>
              </Menu>
            </Box>
          ) : status === "unauthenticated" ? (
            <Button
              color="inherit"
              onClick={signInRequired}
              variant="outlined"
            >
              Sign In
            </Button>
          ) : null}
        </Box>
      </Toolbar>
    </AppBar>
  )
}