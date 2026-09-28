'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function UserBar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname === '/login') return null

  return (
    <header className="app-masthead">
      <div className="masthead-identity">
        <span className="masthead-monogram" aria-hidden="true">AF</span>
        <div className="min-w-0">
          <span className="masthead-eyebrow">RED ADAIR / TECHNICAL</span>
          <div className="masthead-title">AFSS Control Desk</div>
        </div>
      </div>
      <div className="masthead-logos">
        <Image
          src="/logo-evacuation.png"
          alt="Adair Evacuation Consultants"
          width={140}
          height={40}
          className="h-9 w-auto object-contain"
        />
        <Image
          src="/logo-fire-audits.png"
          alt="Adair Fire Audits & Certification"
          width={120}
          height={40}
          className="h-8 w-auto object-contain"
        />
      </div>
      <div className="masthead-account">
        <span className="masthead-account-label">SIGNED IN</span>
        <span className="truncate min-w-0">{session.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="masthead-signout"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
