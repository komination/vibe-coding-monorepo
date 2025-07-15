import { Typography, Box, IconButton } from '@mui/material'
import { ArrowBack, Settings } from '@mui/icons-material'

interface BoardPageProps {
  params: Promise<{ id: string }>
}

export default async function BoardPage({ params }: BoardPageProps) {
  const { id } = await params

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton href="/dashboard" sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        
        <Typography variant="h5" component="h1" sx={{ flexGrow: 1 }}>
          ボード: {id}
        </Typography>
        
        <IconButton>
          <Settings />
        </IconButton>
      </Box>

      <Box sx={{ flexGrow: 1, bgcolor: 'grey.100', borderRadius: 1, p: 2 }}>
        <Typography color="text.secondary" align="center">
          ボードコンテンツを実装中...
        </Typography>
      </Box>
    </Box>
  )
}