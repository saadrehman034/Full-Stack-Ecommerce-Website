import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'http://localhost',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const url = request.nextUrl.clone()

  if (url.pathname.startsWith('/account') && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if ((url.pathname.startsWith('/admin') || url.pathname.startsWith('/pos') || url.pathname.startsWith('/dashboard')) && !user) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Role checks are done in Server Component layouts (admin/layout.tsx, dashboard/layout.tsx)
  // to avoid expensive DB queries in middleware on every request.

  return supabaseResponse
}
