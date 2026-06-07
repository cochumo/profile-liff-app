import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createSupabase } from './db'

type Env = {
  SUPABASE_URL: string
  SUPABASE_SERVICE_KEY: string
}

const app = new Hono<{ Bindings: Env }>()

app.use('/api/*', cors())

app.get('/api/quote', async (c) => {
  const zenRes = await fetch('https://zenquotes.io/api/random')
  const [{ q, a }] = (await zenRes.json()) as [{ q: string; a: string }]

  const transRes = await fetch(
    `https://api.mymemory.translated.net/get?q=${encodeURIComponent(q)}&langpair=en|ja`,
  )
  const { responseData } = (await transRes.json()) as {
    responseData: { translatedText: string }
  }

  return c.json({ quote: q, author: a, quoteJa: responseData.translatedText })
})

// 名言をDBに記録
app.post('/api/history', async (c) => {
  const { userId, quoteJa, author } = await c.req.json<{
    userId: string
    quoteJa: string
    author: string
  }>()

  const supabase = createSupabase(c.env)
  const { error } = await supabase
    .from('quote_history')
    .insert({ user_id: userId, quote_ja: quoteJa, author })

  if (error) return c.json({ error: error.message }, 500)
  return c.json({ ok: true })
})

// ユーザーの名言履歴を取得（最新10件）
app.get('/api/history/:userId', async (c) => {
  const userId = c.req.param('userId')
  const supabase = createSupabase(c.env)

  const { data, error } = await supabase
    .from('quote_history')
    .select('id, quote_ja, author, shown_at')
    .eq('user_id', userId)
    .order('shown_at', { ascending: false })
    .limit(10)

  if (error) return c.json({ error: error.message }, 500)
  return c.json(data)
})

export default app
