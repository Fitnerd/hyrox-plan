import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

// Lightweight auth config for Edge Runtime (middleware)
// Does not import Prisma or bcrypt (Node.js-only modules)
export const { auth } = NextAuth({
  providers: [Credentials({})],
  session: { strategy: 'jwt' },
  trustHost: true,
  pages: { signIn: '/login' },
})
