'use client'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function LoginContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (error === 'AccessDenied') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_50%_0%,#ef4444_0%,#e11d2e_58%,#d71920_100%)]">
        <div className="auth-card bg-white border border-[#fecaca] border-t-4 border-t-[#e11d2e] rounded-2xl p-8 w-full max-w-md shadow-2xl text-center">
          <span className="auth-kicker">RED ADAIR / AFSS CONTROL DESK</span>
          <div className="w-16 h-16 bg-[#fee2e2] border border-[#fecaca] rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-[#d71920]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-5V9m0 0V7m0 2h2m-2 0H10M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
          </div>

          <h1 className="text-xl font-bold text-[#111827] mb-2">Access Denied</h1>
          <p className="text-[#475569] text-sm leading-relaxed mb-6">
            Your account is not authorised to access the{' '}
            <span className="text-[#111827] font-medium">AFSS Backlog</span> system.
            This system is restricted to members of the{' '}
            <span className="text-[#111827] font-medium">Technical AFSS - Deployment</span> group.
          </p>

          <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl p-4 mb-6 text-left">
            <p className="text-[#d71920] text-xs font-medium uppercase tracking-wider mb-3">To request access:</p>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 bg-[#e11d2e] rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-[#111827] text-sm font-medium">Contact your manager</p>
                <p className="text-[#475569] text-xs mt-0.5">
                  Ask to be added to the <span className="text-[#d71920]">Technical AFSS - Deployment</span> group in Google Workspace.
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={() => signIn('google', { callbackUrl: '/' })}
            className="w-full text-[#d71920] text-xs py-2 hover:text-[#c91f26] transition-colors cursor-pointer"
          >
            Try a different account
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[radial-gradient(circle_at_50%_0%,#ef4444_0%,#e11d2e_58%,#d71920_100%)]">
      <div className="auth-card bg-white border border-[#fecaca] border-t-4 border-t-[#e11d2e] rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <span className="auth-kicker">RED ADAIR / AFSS CONTROL DESK</span>
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#e11d2e] rounded-xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(220,38,38,0.4)]">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 21c4.4 0 8-3.6 8-8 0-3.4-1.8-6.1-5-8-.2 2.4-1.4 4-3 4-1-3-1.4-5.5-.4-8C7.1 4.4 4 8.2 4 13c0 4.4 3.6 8 8 8Z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#111827]">AFSS Backlog</h1>
          <p className="text-[#475569] text-sm mt-1">Red Adair Technical</p>
        </div>

        {error && error !== 'AccessDenied' && (
          <div className="mb-5 p-3 bg-[#fef2f2] border border-[#fecaca] rounded-lg text-[#d71920] text-sm text-center">
            Sign-in error. Please try again.
          </div>
        )}

        <button
          onClick={() => signIn('google', { callbackUrl: '/' })}
          className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
        >
          <GoogleIcon />
          Sign in with Google
        </button>

        <p className="text-center text-[#475569] text-xs mt-6 leading-relaxed">
          Access is restricted to members of the<br />
          <span className="text-[#d71920]">Technical AFSS - Deployment</span> group.
        </p>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
