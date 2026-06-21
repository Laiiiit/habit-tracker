import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { SignJWT } from 'jose';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!res.ok) return null;

          const user = await res.json();
          return user; // { id, email, name, image }
        } catch {
          return null;
        }
      },
    }),
  ],

  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.sub = user.id;
        token.email = user.email;
        token.name = user.name;

        // Создаём обычный HS256 JWT для Express-бэкенда
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);
        token.apiToken = await new SignJWT({
          sub: user.id,
          id: user.id,
          email: user.email,
          name: user.name,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .sign(secret);
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
      }
      // Передаём API-токен фронту для запросов к Express
      (session as any).accessToken = token.apiToken;
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
