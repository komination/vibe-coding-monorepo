import { notFound } from "next/navigation"
import { Container, Typography, Box, Chip, Paper } from "@mui/material"
import { getBoard } from "@/lib/actions/boards"
import LockIcon from "@mui/icons-material/Lock"
import PublicIcon from "@mui/icons-material/Public"

interface BoardPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params
  
  // Fetch board data
  const board = await getBoard(id)

  if (!board) {
    notFound()
  }

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Board Header */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ flexGrow: 1 }}>
            {board.title}
          </Typography>
          
          <Chip
            icon={board.isPrivate ? <LockIcon /> : <PublicIcon />}
            label={board.isPrivate ? "Private" : "Public"}
            color={board.isPrivate ? "warning" : "success"}
            variant="outlined"
          />
        </Box>

        {board.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {board.description}
          </Typography>
        )}

        {/* Board Stats */}
        <Box sx={{ display: "flex", gap: 2 }}>
          {board.memberCount !== undefined && (
            <Chip
              label={`${board.memberCount} member${board.memberCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          )}
          {board.listCount !== undefined && (
            <Chip
              label={`${board.listCount} list${board.listCount !== 1 ? 's' : ''}`}
              size="small"
              variant="outlined"
            />
          )}
        </Box>
      </Paper>

      {/* Kanban Board Content Area */}
      <Paper sx={{ p: 3, minHeight: "60vh" }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "400px",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Typography variant="h5" color="text.secondary">
            Kanban Board Coming Soon
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            The Kanban board functionality will be implemented here.
            <br />
            This will include lists, cards, drag & drop, and collaboration features.
          </Typography>
        </Box>
      </Paper>
    </Container>
  )
}

// Generate metadata for the page
export async function generateMetadata({ params }: BoardPageProps) {
  const { id } = await params
  const board = await getBoard(id)

  if (!board) {
    return {
      title: "Board Not Found",
    }
  }

  return {
    title: `${board.title} | Kanban`,
    description: board.description || `Kanban board: ${board.title}`,
  }
}