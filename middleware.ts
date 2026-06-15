import { auth } from '@/lib/auth/middleware'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const pathname = req.nextUrl.pathname
  const isOnboarding = pathname.startsWith('/onboarding')
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/plan') ||
    pathname.startsWith('/bestandstest') ||
    pathname.startsWith('/profil') ||
    isOnboarding

  if (!isLoggedIn && isProtected) {
    return Response.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/plan/:path*',
    '/bestandstest/:path*',
    '/profil/:path*',
    '/onboarding/:path*',
  ],
}
