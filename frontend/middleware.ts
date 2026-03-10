import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/profile', '/dashboard', '/settings', '/auth/verify-email'];
const authRoutes = ['/auth/login', '/auth/registration'];
const completionRoutes = ['/auth/profile/complete', '/auth/verify-email'];
const publicVerifyRoutes = ['/auth/verify-email/verify', '/settings/email-update/verify'];

function decodeJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(req: NextRequest) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();

  // 1️⃣ No token → protect private routes
  if (!token) {
    // Allow public verification route without token
    if (publicVerifyRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.next();
    }
    if (protectedRoutes.some((route) => pathname.startsWith(route))) {
      url.pathname = '/auth/login';
      return NextResponse.redirect(url);
    }
    // Public routes can proceed
    return NextResponse.next();
  }

  // 2️⃣ Token exists → decode and extract user data
  let userData;
  try {
    userData = decodeJwt(token);
  } catch (err) {
    console.error('Invalid token:', err);
    url.pathname = '/auth/login';
    return NextResponse.redirect(url);
  }

  const { is_verified, completed_profile } = userData.data || {};

  // Allow unverified users to access the token verification page
  if (!is_verified && pathname.startsWith('/auth/verify-email/verify')) {
    return NextResponse.next();
  }

  if (!is_verified && !pathname.startsWith('/auth/verify-email')) {
    url.pathname = '/auth/verify-email';
    return NextResponse.redirect(url);
  }

  // 4️⃣ Redirect incomplete profiles (except on completion page)
  if (is_verified && !completed_profile && !pathname.startsWith('/auth/profile/complete')) {
    url.pathname = '/auth/profile/complete';
    return NextResponse.redirect(url);
  }

  // 5️⃣ Prevent verified users from visiting login/signup/verify pages
  if (is_verified &&  completed_profile && (authRoutes.some((route) => pathname.startsWith(route)) || completionRoutes.some((route) => pathname.startsWith(route)))) {
    url.pathname = `/profile/${userData.data.username}`;
    return NextResponse.redirect(url);
  }

  // ✅ Allow everything else
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
    '/auth/:path*',
  ],
};
