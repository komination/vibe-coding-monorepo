import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { prisma, connectDatabase } from '@/infrastructure/database/prisma'
import { createApiRoutes } from '@/interfaces/http/routes/index'
import { authMiddleware } from '@/interfaces/http/middleware/auth'

const app = new Hono()

// CORS設定
app.use('/*', cors({
  origin: 'http://localhost:4001',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Kanban API Server',
    version: '1.0.0',
    status: 'running'
  })
})

// Legacy message endpoint (keep for compatibility)
app.get('/api/message', async(c) => {
  return c.json({
    message: 'こんにちは！これはバックエンドAPIから取得したメッセージです。',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

// Mount API routes (authentication middleware is applied selectively within routes)
const apiRoutes = createApiRoutes(prisma)
app.route('/api', apiRoutes)

// Global error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err)
  return c.json({ 
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  }, 500)
})

// 404 handler
app.notFound((c) => {
  return c.json({ 
    error: 'Not found',
    path: c.req.path,
    timestamp: new Date().toISOString()
  }, 404)
})

// Start server
async function startServer() {
  try {
    // Connect to database
    await connectDatabase()
    
    // Start HTTP server
    serve({
      fetch: app.fetch,
      port: 3001
    }, (info) => {
      console.log(`🚀 Kanban API Server is running on http://localhost:${info.port}`)
      console.log(`📊 Health check: http://localhost:${info.port}/api/health`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
