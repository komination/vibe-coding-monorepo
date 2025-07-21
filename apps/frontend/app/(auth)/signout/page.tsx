import { signOut, auth } from "@/auth"
import { Button, Container, Typography, Box, Card, CardContent } from "@mui/material"
import { redirect } from "next/navigation"
import LogoutIcon from "@mui/icons-material/Logout"
import HomeIcon from "@mui/icons-material/Home"
import Link from "next/link"

export default async function SignOutPage() {
  const session = await auth()
  
  // Redirect if not authenticated
  if (!session) {
    redirect("/")
  }

  return (
    <Container maxWidth="sm">
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <Card sx={{ width: "100%", maxWidth: 400 }}>
          <CardContent sx={{ p: 4, textAlign: "center" }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Sign Out
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Are you sure you want to sign out?
            </Typography>
            
            <Box sx={{ mt: 3, display: "flex", gap: 2 }}>
              <form
                action={async () => {
                  "use server"
                  await signOut({ redirectTo: "/" })
                }}
                style={{ flex: 1 }}
              >
                <Button
                  type="submit"
                  variant="contained"
                  color="error"
                  startIcon={<LogoutIcon />}
                  sx={{ py: 1.5 }}
                  fullWidth
                >
                  Sign Out
                </Button>
              </form>
              
              <Button
                component={Link}
                href="/dashboard"
                variant="outlined"
                startIcon={<HomeIcon />}
                sx={{ py: 1.5, flex: 1 }}
              >
                Cancel
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}