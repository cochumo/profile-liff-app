import { Hono } from 'hono'
import { cors } from 'hono/cors'

const app = new Hono()

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

  return c.json({
    quote: q,
    author: a,
    quoteJa: responseData.translatedText,
  })
})

export default app
