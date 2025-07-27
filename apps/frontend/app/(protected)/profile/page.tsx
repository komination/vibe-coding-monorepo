import ProfileClient from "./components/ProfileClient"
import { getSession } from "@/lib/server/auth"

export default async function ProfilePage() {
  const session = await getSession()
  return <ProfileClient session={session} />
}