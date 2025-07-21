"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Typography,
  Grid,
  Button,
  Box,
  CircularProgress,
  Alert,
  Fab,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import { boardsApi, type Board } from "@/lib/api"
import { BoardCard } from "@/app/components/BoardCard"
import { CreateBoardDialog } from "@/app/components/CreateBoardDialog"

export default function DashboardPage() {
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)

  const fetchBoards = async () => {
    try {
      setLoading(true)
      setError(null)
      const userBoards = await boardsApi.getUserBoards()
      setBoards(userBoards)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load boards")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBoards()
  }, [])

  const handleBoardCreated = () => {
    fetchBoards()
  }

  const handleDeleteBoard = async (boardId: string) => {
    if (!confirm("Are you sure you want to delete this board?")) {
      return
    }

    try {
      await boardsApi.deleteBoard(boardId)
      setBoards(prev => prev.filter(board => board.id !== boardId))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete board")
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg">
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress />
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h4" component="h1" fontWeight={600}>
            My Boards
          </Typography>
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
    </Container>
  )
}