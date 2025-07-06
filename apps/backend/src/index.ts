import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serverConfig, appConfig } from '@/infrastructure/config/env'
import { prisma, connectDatabase } from '@/infrastructure/database/prisma'
import { createApiRoutes } from '@/interfaces/http/routes/index'
import { errorHandler } from '@/interfaces/http/middleware/errorHandler'
// authMiddleware is now created inside createApiRoutes

const app = new Hono()

// CORS設定
app.use('/*', cors({
  origin: appConfig.frontendUrl,
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
app.onError(errorHandler)

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
      port: serverConfig.port
    }, (info) => {
      console.log(`🚀 ${appConfig.name} Server is running on http://localhost:${info.port}`)
      console.log(`📊 Health check: http://localhost:${info.port}/api/health`)
      console.log(`🌍 Environment: ${serverConfig.nodeEnv}`)
    })
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

startServer()
