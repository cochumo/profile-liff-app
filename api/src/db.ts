import { createClient } from '@supabase/supabase-js'

export type QuoteHistory = {
  id: string
  user_id: string
  quote_ja: string
  author: string
  shown_at: string
}

export function createSupabase(env: { SUPABASE_URL: string; SUPABASE_SERVICE_KEY: string }) {
  return createClient<{ quote_history: { Row: QuoteHistory } }>(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_KEY,
  )
}
