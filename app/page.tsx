import { redirect } from 'next/navigation'
import { isDatabaseEmpty } from '@/lib/auth'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
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
}

