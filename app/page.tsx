import { redirect } from 'next/navigation'
import { isDatabaseEmpty } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export default async function HomePage() {
  const isEmpty = await isDatabaseEmpty()
  
  if (isEmpty) {
    redirect('/setup')
  }

  const userId = cookies().get('userId')?.value
  if (!userId) {
    redirect('/login')
  }

  redirect('/safes')
}

