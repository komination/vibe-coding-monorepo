"use client"

import { useState } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
  Alert,
} from "@mui/material"
import { createBoard, type CreateBoardRequest } from "@/lib/actions/boards"
import { useServerActionErrorHandler } from "@/lib/actions/errorHandler"

interface CreateBoardDialogProps {
  open: boolean
  onClose: () => void
  onBoardCreated: (boardId?: string) => void
}

export function CreateBoardDialog({
  open,
  onClose,
  onBoardCreated,
}: CreateBoardDialogProps) {
  const [formData, setFormData] = useState<CreateBoardRequest>({
    title: "",
    description: "",
    isPrivate: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { handleWithReauth } = useServerActionErrorHandler()

  const handleChange = (field: keyof CreateBoardRequest) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === "isPrivate" ? event.target.checked : event.target.value
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    
    if (!formData.title.trim()) {
      setError("Board title is required")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const result = await createBoard({
        title: formData.title.trim(),
        description: formData.description?.trim() || undefined,
        isPrivate: formData.isPrivate,
      })
      
      // Reset form and close dialog
      setFormData({ title: "", description: "", isPrivate: false })
      
      // Pass the board ID to the parent component for redirect
      const boardId = result.boardId || result.board?.id
      onBoardCreated(boardId)
      onClose()
    } catch (err) {
      // Use enhanced error handling
      const parsedError = await handleWithReauth(err)
      setError(parsedError.userMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ title: "", description: "", isPrivate: false })
      setError(null)
      onClose()
    }
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Create New Board</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Board Title"
              value={formData.title}
              onChange={handleChange("title")}
              required
              fullWidth
              autoFocus
              disabled={loading}
            />
            
            <TextField
              label="Description (optional)"
              value={formData.description}
              onChange={handleChange("description")}
              multiline
              rows={3}
              fullWidth
              disabled={loading}
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={formData.isPrivate}
                  onChange={handleChange("isPrivate")}
                  disabled={loading}
                />
              }
              label="Private board (only invited members can see it)"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? "Creating..." : "Create Board"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}