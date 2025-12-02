import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getSafeById, getTransactions } from '@/app/actions/safe'
import SafeDetailClient from './SafeDetailClient'

export const dynamic = 'force-dynamic'

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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-red-400">Erreur: {safeResult.error}</div>
      </div>
    )
  }

  const safe = safeResult.safe!
  const transactionsResult = await getTransactions(id)
  const transactions = transactionsResult.transactions || []

  const hasWritePermission =
    user.role === 'ADMIN' ||
    safe.permissions.some((p: any) => p.canWrite || p.canManage)

  return (
    <SafeDetailClient
      safe={safe}
      transactions={transactions}
      currentUser={user}
      hasWritePermission={hasWritePermission}
    />
  )
}

