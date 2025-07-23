"use client"

import { useState } from "react"
import {
  Container,
  Paper,
  Typography,
  Box,
  Avatar,
  TextField,
  Button,
  Alert,
  Grid,
} from "@mui/material"
import { updateProfile } from "@/lib/actions/profile"
import { useServerActionErrorHandler } from "@/lib/actions/errorHandler"

interface ProfileClientProps {
  session: any
}

export default function ProfileClient({ session }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(session.user?.name || "")
  const [email] = useState(session.user?.email || "")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const { handleWithReauth } = useServerActionErrorHandler()
  
  const handleSave = async () => {
    setLoading(true)
    setMessage(null)
    
    try {

      // Use Server Action to update profile
      const result = await updateProfile({
        name: name.trim(),
      })

      if (result.success) {
        setMessage({ type: "success", text: "Profile updated successfully!" })
        setIsEditing(false)
        // Update local state with new name
        if (result.profile?.name) {
          setName(result.profile.name)
        }
      }
    } catch (err) {
      // Use enhanced error handling
      const parsedError = await handleWithReauth(err)
      setMessage({ type: "error", text: parsedError.userMessage })
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setName(session.user?.name || "")
    setIsEditing(false)
    setMessage(null)
  }

  // Get user initials for avatar
  const getUserInitials = () => {
    if (name && typeof name === 'string' && name.trim()) {
      return name.trim().charAt(0).toUpperCase()
    }
    if (email && typeof email === 'string' && email.trim()) {
      return email.trim().charAt(0).toUpperCase()
    }
    return "U"
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: "flex", alignItems: "center", mb: 4 }}>
          <Avatar
            src={session.user?.image || undefined}
            sx={{ width: 80, height: 80, mr: 3, fontSize: "2rem" }}
          >
            {getUserInitials()}
          </Avatar>
          <Box>
            <Typography variant="h6">
              {(name && typeof name === 'string' ? name.trim() : '') || 
               (email && typeof email === 'string' ? email.trim() : '') || 
               "User"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email && typeof email === 'string' ? email.trim() : 'No email available'}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isEditing || loading}
              variant="outlined"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              fullWidth
              label="Email"
              value={email}
              disabled
              variant="outlined"
              helperText="Email cannot be changed"
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
          {!isEditing ? (
            <Button
              variant="contained"
              onClick={() => setIsEditing(true)}
            >
              Edit Profile
            </Button>
          ) : (
            <>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outlined"
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
            </>
          )}
        </Box>
      </Paper>
    </Container>
  )
}