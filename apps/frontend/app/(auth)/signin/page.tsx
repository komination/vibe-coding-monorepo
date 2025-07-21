import { signIn, auth } from "@/auth"
import { Button, Container, Typography, Box, Card, CardContent } from "@mui/material"
import { redirect } from "next/navigation"
import LoginIcon from "@mui/icons-material/Login"

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const session = await auth()
  const params = await searchParams
  
  // Redirect if already authenticated
  if (session) {
    redirect(params.callbackUrl || "/dashboard")
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
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Sign in to access your Kanban boards
            </Typography>
            
            <form
              action={async () => {
                "use server"
                await signIn("cognito", { 
                  redirectTo: params.callbackUrl || "/dashboard" 
                })
              }}
            >
              <Button
                type="submit"
                variant="contained"
                size="large"
                startIcon={<LoginIcon />}
                sx={{ mt: 3, py: 1.5, px: 4 }}
                fullWidth
              >
                Sign in with AWS Cognito
              </Button>
            </form>

            <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
              New to Kanban? You'll create an account automatically when you sign in.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Container>
  )
}