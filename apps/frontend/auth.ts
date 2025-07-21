import NextAuth from "next-auth"
import type { NextAuthConfig } from "next-auth"
import Cognito from "next-auth/providers/cognito"

/**
 * NextAuth.js configuration with Cognito Confidential Client
 * Uses Cognito Hosted UI with Client Secret for secure token exchange
 */
export const config = {
  providers: [
    Cognito({
      clientId: process.env.COGNITO_CLIENT_ID!,
      clientSecret: process.env.COGNITO_CLIENT_SECRET!,
      issuer: process.env.COGNITO_ISSUER,
      authorization: {
        url: `${process.env.COGNITO_DOMAIN}/oauth2/authorize`,
        params: {
          scope: "openid email profile",
          response_type: "code",
        },
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account, profile }) {
      // Store Cognito tokens for backend API calls
      if (account?.provider === "cognito") {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.cognitoSub = profile?.sub
      }
      return token
    },
    async session({ session, token }) {
      // Pass tokens to session for API calls
      session.accessToken = token.accessToken as string
      session.refreshToken = token.refreshToken as string
      session.cognitoSub = token.cognitoSub as string
      return session
    },
  },
  pages: {
    signIn: "/signin",
    signOut: "/signout",
  },
  debug: process.env.NODE_ENV === "development",
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)