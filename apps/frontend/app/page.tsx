import { auth } from "@/auth"
import { Button, Container, Typography, Box } from "@mui/material"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function HomePage() {
  const session = await auth()

  // Redirect authenticated users to dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <Container maxWidth="md">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        textAlign="center"
        gap={4}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Welcome to Kanban
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          Organize your work with powerful Kanban boards
        </Typography>
        <Button
          component={Link}
          href="/signin"
          variant="contained"
          size="large"
          sx={{ px: 4, py: 1.5 }}
        >
          Get Started
        </Button>
      </Box>
    </Container>
  )
}