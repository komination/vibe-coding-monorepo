import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { auth } from "@/auth"
import { SessionProvider } from "./components/SessionProvider"
import { ThemeRegistry } from "./components/ThemeRegistry"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Kanban - Organize Your Work",
  description: "A powerful Kanban board application for project management",
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  return (
    <html lang="en">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <ThemeRegistry>
            {children}
          </ThemeRegistry>
        </SessionProvider>
      </body>
    </html>
  )
}
