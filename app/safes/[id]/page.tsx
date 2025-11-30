import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getSafeById, getTransactions } from '@/app/actions/safe'
import SafeDetailClient from './SafeDetailClient'

export default async function SafeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const { id } = await params
  const safeResult = await getSafeById(id)
  if (safeResult.error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Erreur: {safeResult.error}</div>
      </div>
    )
  }

  const safe = safeResult.safe!
  const transactionsResult = await getTransactions(id)
  const transactions = transactionsResult.transactions || []

  const hasWritePermission =
    user.role === 'ADMIN' ||
    safe.permissions.some((p) => p.canWrite || p.canManage)

  return (
    <SafeDetailClient
      safe={safe}
      transactions={transactions}
      currentUser={user}
      hasWritePermission={hasWritePermission}
    />
  )
}

