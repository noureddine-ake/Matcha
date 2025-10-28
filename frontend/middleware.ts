import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { jwtDecode } from "jwt-decode";

// const protectedRoutes = [
//   '/dashboard',
//   '/profile',
//   '/settings',
//   '/discover',
//   '/chat',
//   '/search',
//   '/likes',
//   '/auth/verify-email',
// ];

// const noneTokenRoutes = [
//   '/dashboard',
//   '/profile',
//   '/settings',
//   '/discover',
//   '/chat',
//   '/search',
//   '/likes',
//   '/auth/verify-email',
// ];

const protectedRoutes = ['/profile', '/dashboard', '/settings', '/auth/verify-email'];
const authRoutes = ['/auth/login', '/auth/registration'];
const completionRoutes = ['/profile/complete', '/auth/verify-email'];



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
  console.log("dkhel hhhh");

  // 1️⃣ No token → protect private routes
  if (!token) {
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

  // 3️⃣ Redirect unverified users (except on verification page)
  console.log("is_verified, completed_profile", is_verified, completed_profile, "==============");
  
  if (!is_verified && !pathname.startsWith('/auth/verify-email')) {
    url.pathname = '/auth/verify-email';
    return NextResponse.redirect(url);
  }

  // 4️⃣ Redirect incomplete profiles (except on completion page)
  if (is_verified && !completed_profile && !pathname.startsWith('/profile/complete')) {
    url.pathname = '/profile/complete';
    return NextResponse.redirect(url);
  }

  // 5️⃣ Prevent verified users from visiting login/signup/verify pages
  if (is_verified &&  completed_profile && (authRoutes.some((route) => pathname.startsWith(route)) || completionRoutes.some((route) => pathname.startsWith(route)))) {
    url.pathname = '/profile';
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
