import { Container, Typography, Button, Box, Paper } from "@mui/material"
import Link from "next/link"
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline"
import DashboardIcon from "@mui/icons-material/Dashboard"

export default function BoardNotFound() {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
        }}
      >
        <Paper sx={{ p: 4, maxWidth: 500 }}>
          <ErrorOutlineIcon sx={{ fontSize: 64, color: "error.main", mb: 2 }} />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Board Not Found
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            The board you're looking for doesn't exist or you don't have permission to view it.
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This could happen if:
          </Typography>
          
          <Box component="ul" sx={{ textAlign: "left", mb: 3, pl: 2 }}>
            <Typography component="li" variant="body2" color="text.secondary">
              The board was deleted
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              You don't have access to this private board
            </Typography>
            <Typography component="li" variant="body2" color="text.secondary">
              The URL is incorrect
            </Typography>
          </Box>

          <Button
            component={Link}
            href="/dashboard"
            variant="contained"
            startIcon={<DashboardIcon />}
            size="large"
          >
            Go to Dashboard
          </Button>
        </Paper>
      </Box>
    </Container>
  )
}