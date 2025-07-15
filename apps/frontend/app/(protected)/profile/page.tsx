import { Typography, Box, Card, CardContent } from '@mui/material'

export default function ProfilePage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        プロフィール設定
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            ユーザー情報
          </Typography>
          <Typography color="text.secondary">
            プロフィール設定を実装中...
          </Typography>
        </CardContent>
      </Card>
    </Box>
  )
}