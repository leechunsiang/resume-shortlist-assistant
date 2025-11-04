import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  try {
    const supabase = createMiddlewareClient({ req, res });

    // Refresh session if expired - this is crucial for maintaining auth state
    const {
      data: { session },
    } = await supabase.auth.getSession();

    console.log('[MIDDLEWARE]', req.nextUrl.pathname, 'Session:', session ? 'exists' : 'none');

    // If user is signed in and trying to access login/signup, redirect to dashboard
    if (session && (req.nextUrl.pathname.startsWith('/login') || req.nextUrl.pathname.startsWith('/signup'))) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.pathname = '/';
      return NextResponse.redirect(redirectUrl);
    }

    // Don't block access - let the client-side handle auth redirects
    // This prevents the middleware from incorrectly redirecting users who are logged in
    return res;
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error);
    return res;
  }
}

export const config = {
  matcher: [
    '/login',
    '/signup',
    '/job-listings/:path*',
    '/candidates/:path*',
    '/settings/:path*',
    '/organization/:path*',
    '/audit/:path*'
  ],
};
