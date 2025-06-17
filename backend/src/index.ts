import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

// CORS設定
app.use('/*', cors({
  origin: 'http://localhost:4001',
  allowHeaders: ['Content-Type'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}))

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

// APIエンドポイントを追加
app.get('/api/message', (c) => {
  return c.json({
    message: 'こんにちは！これはバックエンドAPIから取得したメッセージです。',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

serve({
  fetch: app.fetch,
  port: 3001
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
