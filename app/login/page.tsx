import { redirect } from 'next/navigation'
import { isDatabaseEmpty } from '@/lib/auth'
import LoginClient from './LoginClient'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Vérifier si la base de données est vide
  const isEmpty = await isDatabaseEmpty()
  
  if (isEmpty) {
    redirect('/setup')
  }

  return <LoginClient />
}
