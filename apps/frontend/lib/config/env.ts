interface Env {
  NEXTAUTH_URL: string
  NEXTAUTH_SECRET: string
  COGNITO_CLIENT_ID: string
  COGNITO_CLIENT_SECRET: string
  COGNITO_ISSUER: string
  BACKEND_URL: string
  NODE_ENV: "development" | "production" | "test"
}

function getEnvVar(name: keyof Env, defaultValue?: string): string {
  const value = process.env[name] || defaultValue
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export const env: Env = {
  NEXTAUTH_URL: getEnvVar("NEXTAUTH_URL", "http://localhost:4001"),
  NEXTAUTH_SECRET: getEnvVar("NEXTAUTH_SECRET"),
  COGNITO_CLIENT_ID: getEnvVar("COGNITO_CLIENT_ID"),
  COGNITO_CLIENT_SECRET: getEnvVar("COGNITO_CLIENT_SECRET"),
  COGNITO_ISSUER: getEnvVar("COGNITO_ISSUER"),
  BACKEND_URL: getEnvVar("BACKEND_URL", "http://localhost:3001"),
  NODE_ENV: (process.env.NODE_ENV as Env["NODE_ENV"]) || "development",
}

// Client-side safe config (only non-sensitive values)
export const clientEnv = {
  NODE_ENV: env.NODE_ENV,
} as const