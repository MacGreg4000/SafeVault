import { redirect } from 'next/navigation'
import { isDatabaseEmpty } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  try {
    const isEmpty = await isDatabaseEmpty()
    
    if (isEmpty) {
      redirect('/setup')
    }

    const cookieStore = await cookies()
    const userId = cookieStore.get('userId')?.value
    if (!userId) {
      redirect('/login')
    }

    redirect('/safes')
  } catch (error) {
    // Si la base de données n'est pas accessible, rediriger vers la page de setup
    console.error('Erreur lors de l\'accès à la base de données:', error)
    redirect('/setup')
  }
}

