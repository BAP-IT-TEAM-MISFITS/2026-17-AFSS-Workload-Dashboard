'use client'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import Image from 'next/image'

export default function UserBar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session || pathname === '/login') return null

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-2 bg-[#fffdfd] border-t-[3px] border-t-[#b91c1c] border-b border-b-[#efb4b4] text-xs text-[#704147] min-w-0">
      <div />
      <div className="flex items-center gap-4 justify-self-center">
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
      <div className="flex items-center gap-3 min-w-0 justify-self-end">
        <span className="truncate min-w-0">{session.user?.email}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-[#991b1b] hover:text-[#7f1d1d] transition-colors cursor-pointer font-semibold"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
