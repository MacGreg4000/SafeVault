import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getUsers } from '@/app/actions/user'
import { getAllSafes } from '@/app/actions/permission'
import UsersClient from './UsersClient'

export default async function UsersPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  if (user.role !== 'ADMIN') {
    redirect('/safes')
  }

  const result = await getUsers()
  if (result.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-red-400">
        Erreur: {result.error}
      </div>
    )
  }

  const safesResult = await getAllSafes()
  const safes = safesResult.safes || []

  return (
    <UsersClient initialUsers={result.users || []} safes={safes} />
  )
}

