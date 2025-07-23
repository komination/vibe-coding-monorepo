import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { Box } from "@mui/material"
import { Header } from "../components/Header"
import { AuthenticationAlert } from "../components/AuthenticationAlert"

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/signin")
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <Header />
      <AuthenticationAlert />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        {children}
      </Box>
    </Box>
  )
}