import liff from '@line/liff'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({ component: ProfilePage })

type Profile = {
  displayName: string
  pictureUrl?: string
  userId: string
}

type Quote = {
  quoteJa: string
  author: string
}

type HistoryItem = {
  id: string
  quote_ja: string
  author: string
  shown_at: string
}

let liffInited = false

async function ensureLiffInit() {
  if (liffInited) return
  if (import.meta.env.DEV) {
    const { LiffMockPlugin } = await import('@line/liff-mock')
    liff.use(new LiffMockPlugin())
    await (liff.init as (config: { liffId: string; mock: boolean }) => Promise<void>)({
      liffId: import.meta.env.VITE_LIFF_ID,
      mock: true,
    })
    liff.login()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(liff as any).$mock.set((prev: any) => ({ ...prev, isLoggedIn: true }))
  } else {
    await liff.init({ liffId: import.meta.env.VITE_LIFF_ID })
  }
  liffInited = true
}

const API = import.meta.env.VITE_API_BASE_URL

async function fetchQuote(): Promise<Quote> {
  const res = await fetch(`${API}/api/quote`)
  if (!res.ok) throw new Error('名言の取得に失敗しました')
  return res.json()
}

async function saveHistory(userId: string, quote: Quote): Promise<void> {
  await fetch(`${API}/api/history`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, quoteJa: quote.quoteJa, author: quote.author }),
  })
}

async function fetchHistory(userId: string): Promise<HistoryItem[]> {
  const res = await fetch(`${API}/api/history/${userId}`)
  if (!res.ok) return []
  return res.json()
}

function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [quote, setQuote] = useState<Quote | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      await ensureLiffInit()

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      const p = await liff.getProfile()
      const userId = p.userId
      setProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl, userId })

      const [q, hist] = await Promise.all([fetchQuote(), fetchHistory(userId)])
      setQuote(q)

      // 取得した名言を履歴に保存してから再取得
      await saveHistory(userId, q)
      const updatedHist = await fetchHistory(userId)
      setHistory(updatedHist)
    }

    init().catch((err: Error) => setError(err.message))
  }, [])

  const handleLogout = () => {
    if (liff.isInClient()) {
      alert('LINEアプリ内ではログアウトできません。\nLINEアプリの設定からログアウトしてください。')
      return
    }
    liff.logout()
    setProfile(null)
    liff.login()
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <p className="text-red-500">{error}</p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {profile.pictureUrl && (
        <img
          src={profile.pictureUrl}
          alt="profile"
          className="h-24 w-24 rounded-full object-cover shadow-md"
        />
      )}
      <p className="text-2xl font-bold">{profile.displayName}</p>

      {quote && (
        <div className="max-w-sm rounded-xl border border-gray-200 bg-gray-50 p-6 text-center shadow-sm">
          <p className="text-base leading-relaxed text-gray-700">「{quote.quoteJa}」</p>
          <p className="mt-3 text-sm text-gray-500">— {quote.author}</p>
        </div>
      )}

      {history.length > 0 && (
        <div className="w-full max-w-sm">
          <h2 className="mb-3 text-sm font-semibold text-gray-500">過去の名言</h2>
          <ul className="space-y-2">
            {history.map((item) => (
              <li key={item.id} className="rounded-lg border border-gray-100 bg-white p-3 shadow-sm">
                <p className="text-sm text-gray-700">「{item.quote_ja}」</p>
                <p className="mt-1 text-xs text-gray-400">
                  {item.author} ·{' '}
                  {new Date(item.shown_at).toLocaleDateString('ja-JP')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        onClick={handleLogout}
        className="rounded-lg bg-green-500 px-6 py-2 text-white transition hover:bg-green-600"
      >
        ログアウト
      </button>
    </div>
  )
}
