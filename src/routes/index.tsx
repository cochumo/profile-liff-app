import liff from '@line/liff'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/')({ component: ProfilePage })

type Profile = {
  displayName: string
  pictureUrl?: string
}

let liffReady: Promise<void> | null = null

function initLiff() {
  if (liffReady) return liffReady
  liffReady = (async () => {
    if (import.meta.env.DEV) {
      const { LiffMockPlugin } = await import('@line/liff-mock')
      liff.use(new LiffMockPlugin())
    }
    await liff.init({ liffId: import.meta.env.VITE_LIFF_ID })
  })()
  return liffReady
}

function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const init = async () => {
      await initLiff()

      if (!liff.isLoggedIn()) {
        liff.login()
        return
      }

      const p = await liff.getProfile()
      setProfile({ displayName: p.displayName, pictureUrl: p.pictureUrl })
    }

    init().catch((err: Error) => setError(err.message))
  }, [])

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
    </div>
  )
}
