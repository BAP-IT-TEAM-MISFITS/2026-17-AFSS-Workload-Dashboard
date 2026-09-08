'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function UserBar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname === '/login') return null

  return (
    <div className="afss-control-bar grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 text-xs text-[#8e99c5] min-w-0">
      <div className="afss-pill afss-pill-neutral justify-self-start">AFSS Backlog</div>
      <div className="flex items-center gap-4 justify-self-center">
        <Image
          src="/logo-evacuation.png"
          alt="Adair Evacuation Consultants"
          width={140}
          height={40}
          className="h-8 w-auto object-contain brightness-0 invert opacity-90"
        />
        <Image
          src="/logo-fire-audits.png"
          alt="Adair Fire Audits & Certification"
          width={120}
          height={40}
          className="h-7 w-auto object-contain brightness-0 invert opacity-90"
        />
      </div>
      <div className="flex items-center gap-3 min-w-0 justify-self-end">
        <span className="truncate min-w-0 text-gray-300">{session.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="afss-btn-outline"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
