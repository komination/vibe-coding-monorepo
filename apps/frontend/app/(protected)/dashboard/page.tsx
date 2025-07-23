import { Container, Typography, Box } from "@mui/material"
import { getBoards } from "@/lib/actions/boards"
import { DashboardClient } from "@/app/(protected)/dashboard/components/DashboardClient"

export default async function DashboardPage() {
  // Fetch boards on the server
  const boards = await getBoards()

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight={600}>
          My Boards
        </Typography>
      </Box>
      
      <DashboardClient initialBoards={boards} />
    </Container>
  )
}