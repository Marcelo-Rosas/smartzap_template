import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * Auth Callback Route
 *
 * Handles Supabase Auth callbacks for:
 * - Email confirmation
 * - Password reset
 * - Magic link login
 * - OAuth callbacks
 *
 * Supabase sends tokens in different ways:
 * 1. PKCE flow: ?code=xxx
 * 2. Email links: ?token_hash=xxx&type=recovery
 * 3. After verification: redirects with session in hash fragment
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = searchParams.get('next') ?? '/'
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')

  // If there's an error from Supabase
  if (error) {
    console.error('[auth/callback] Error:', error, error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
  }

  // Handle PKCE code exchange
  if (code) {
    const supabase = await createClient()
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError) {
      // Redirect based on auth type
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] Code exchange error:', exchangeError)
  }

  // Handle token hash (email links)
  if (token_hash && type) {
    const supabase = await createClient()
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as 'recovery' | 'signup' | 'invite' | 'email',
    })

    if (!verifyError) {
      if (type === 'recovery' || type === 'invite') {
        return NextResponse.redirect(`${origin}/auth/reset-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[auth/callback] OTP verify error:', verifyError)
  }

  // If we get here with no code/token, Supabase already processed the token
  // and is redirecting with session info in hash fragment.
  // The session should already be set, redirect to reset password page.
  // Check if this is a recovery flow by looking at the redirect path
  if (type === 'recovery' || type === 'invite') {
    return NextResponse.redirect(`${origin}/auth/reset-password`)
  }

  // Default: redirect to reset-password since this callback is typically
  // used after email verification for password reset
  return NextResponse.redirect(`${origin}/auth/reset-password`)
}
