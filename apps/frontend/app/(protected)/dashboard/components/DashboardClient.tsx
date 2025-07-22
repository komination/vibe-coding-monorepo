"use client"

import { useState } from "react"
import {
  Typography,
  Grid,
  Button,
  Box,
  Alert,
  Fab,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import { type Board, deleteBoard } from "@/lib/actions/boards"
import { BoardCard } from "@/app/components/BoardCard"
import { CreateBoardDialog } from "@/app/components/CreateBoardDialog"

interface DashboardClientProps {
  initialBoards: Board[]
}

export function DashboardClient({ initialBoards }: DashboardClientProps) {
  const [boards, setBoards] = useState<Board[]>(initialBoards)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null)

  const handleBoardCreated = () => {
    // After board creation via Server Action, we don't need to manually update
    // the list as the page will be revalidated and redirected
    setCreateDialogOpen(false)
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
      
      // The Server Action will handle redirect, but we can optimistically update
      setBoards(prev => prev.filter(board => board.id !== boardId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board")
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
          <Typography variant="body1" color="text.secondary" paragraph>
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
        <Grid container spacing={3}>
          {Array.isArray(boards) && boards.map((board) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={board.id}>
              <BoardCard
                board={board}
                onDelete={() => handleDeleteBoard(board.id)}
                isDeleting={deletingBoardId === board.id}
              />
            </Grid>
          ))}
        </Grid>
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