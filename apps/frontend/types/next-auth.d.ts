import { DefaultSession, DefaultJWT } from "next-auth"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken: string
    refreshToken: string
    cognitoSub: string
  }

  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    cognitoSub?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    cognitoSub?: string
  }
}