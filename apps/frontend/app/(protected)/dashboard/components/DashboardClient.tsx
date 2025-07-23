"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
  Typography,
  Button,
  Box,
  Alert,
  Fab,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import { type Board, deleteBoard } from "@/lib/actions/boards"
import { BoardCard } from "@/app/components/BoardCard"
import { CreateBoardDialog } from "@/app/components/CreateBoardDialog"
import { useServerActionErrorHandler } from "@/lib/actions/errorHandler"

interface DashboardClientProps {
  initialBoards: Board[]
}

export function DashboardClient({ initialBoards }: DashboardClientProps) {
  const [boards, setBoards] = useState<Board[]>(initialBoards)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null)
  const { handleWithReauth } = useServerActionErrorHandler()
  const router = useRouter()

  const handleBoardCreated = (boardId?: string) => {
    // Close the dialog
    setCreateDialogOpen(false)
    
    // If we have a board ID, redirect to the new board page
    if (boardId) {
      router.push(`/board/${boardId}`)
    } else {
      // Fallback: refresh the page to get the updated board list
      router.refresh()
    }
  }

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm("Are you sure you want to delete this board?")) {
      return
    }

    try {
      setDeletingBoardId(boardId)
      setError(null)
      
      // Use Server Action for deletion
      await deleteBoard(boardId)
      
      // Optimistically update the UI
      setBoards(prev => prev.filter(board => board.id !== boardId))
    } catch (err) {
      // Use enhanced error handling
      const parsedError = await handleWithReauth(err)
      setError(parsedError.userMessage)
    } finally {
      setDeletingBoardId(null)
    }
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ display: { xs: "none", sm: "flex" } }}
          >
            Create Board
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
      </Box>

      {boards.length === 0 ? (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="400px"
          textAlign="center"
        >
          <Typography variant="h5" color="text.secondary" gutterBottom>
            No boards yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            Create your first board to get started with organizing your work.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Your First Board
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
            },
            gap: 3,
          }}
        >
          {Array.isArray(boards) && boards.map((board) => (
            <BoardCard
              key={board.id}
              board={board}
              onDelete={() => handleDeleteBoard(board.id)}
              isDeleting={deletingBoardId === board.id}
            />
          ))}
        </Box>
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add"
        onClick={() => setCreateDialogOpen(true)}
        sx={{
          position: "fixed",
          bottom: 16,
          right: 16,
          display: { xs: "flex", sm: "none" },
        }}
      >
        <AddIcon />
      </Fab>

      <CreateBoardDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onBoardCreated={handleBoardCreated}
      />
    </>
  )
}