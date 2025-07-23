import ProfileClient from "./components/ProfileClient"
import { requireAuth } from "@/lib/server/auth"

export default async function ProfilePage() {
  const session = await requireAuth()
  return <ProfileClient session={session} />
}