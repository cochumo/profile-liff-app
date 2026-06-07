import liff from '@line/liff'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({ component: ProfilePage })

type Profile = {
  displayName: string
  pictureUrl?: string
}

let liffInited = false

async function ensureLiffInit() {
  if (liffInited) return
  if (import.meta.env.DEV) {
    const { LiffMockPlugin } = await import('@line/liff-mock')
    liff.use(new LiffMockPlugin())
    // mock: true を渡すことで本物の LIFF 認証をスキップしてモックモードで動作させる
    await (liff.init as (config: { liffId: string; mock: boolean }) => Promise<void>)({
      liffId: import.meta.env.VITE_LIFF_ID,
      mock: true,
    })
    // mock はデフォルトでログアウト状態のため、ログイン済み状態とプロフィールを設定する
    ;(liff as any).$mock.set({ // eslint-disable-line @typescript-eslint/no-explicit-any
      isLoggedIn: true,
      getProfile: {
        userId: 'Umock0000000000000000000000000001',
        displayName: 'Mock User',
        pictureUrl: undefined,
        statusMessage: '',
      },
    })
  } else {
    await liff.init({ liffId: import.meta.env.VITE_LIFF_ID })
  }
  liffInited = true
}

function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      await ensureLiffInit()

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      const p = await liff.getProfile()
      setProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl })
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
      <button
        onClick={handleLogout}
        className="rounded-lg bg-green-500 px-6 py-2 text-white transition hover:bg-green-600"
      >
        ログアウト
      </button>
    </div>
  )
}
