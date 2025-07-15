import { Typography, Box, Grid, Card, CardContent, Button } from '@mui/material'
import { Add as AddIcon } from '@mui/icons-material'

export default function DashboardPage() {
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          ダッシュボード
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
        >
          新しいボード
        </Button>
      </Box>

      <Typography variant="h6" gutterBottom>
        あなたのボード
      </Typography>
      
      <Grid container spacing={3}>
        {/* Placeholder for board cards */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CardContent>
              <Typography color="text.secondary" align="center">
                ボードを読み込み中...
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  )
}