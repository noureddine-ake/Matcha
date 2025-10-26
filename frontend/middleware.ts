import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = [
  '/dashboard',
  '/profile',
  '/settings',
  '/discover',
  '/chat',
  '/search',
  '/likes',
  '/auth/verify-email',
];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value; // adjust "token" to your cookie name
  const url = req.nextUrl.clone();

  // If trying to access a protected route without a token
  if (protectedRoutes.some((path) => req.nextUrl.pathname.startsWith(path))) {
    if (!token) {
      url.pathname = '/auth/login'; // redirect to login page
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Apply middleware only to specific routes
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/profile/:path*',
    '/discover/:path*',
    '/likes/:path*',
    '/chat/:path*',
    '/settings/:path*',
    '/search/:path*',
    '/auth/verify-email',
  ],
};
