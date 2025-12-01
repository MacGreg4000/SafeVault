import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getSafes } from '@/app/actions/safe'
import { logoutAction } from '@/app/actions/auth'
import Link from 'next/link'

export default async function SafesPage() {
  const user = await getCurrentUser()
  if (!user) {
    redirect('/login')
  }

  const result = await getSafes()
  if (result.error) {
    return <div>Erreur: {result.error}</div>
  }

  const safes = result.safes || []

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-white tracking-wide">SafeGuard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300">
                {user.name} <span className="text-slate-500">({user.role})</span>
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-all duration-300 hover:shadow-[0_0_10px_rgba(248,113,113,0.5)]"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Mes coffres-forts
          </h2>
          <p className="text-slate-400">
            Gérez vos coffres-forts et suivez vos transactions
          </p>
        </div>

        {safes.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-8 text-center backdrop-blur-sm">
            <p className="text-slate-300 mb-4">Aucun coffre-fort disponible</p>
            {user.role === 'ADMIN' && (
              <p className="text-sm text-slate-500">
                Créez votre premier coffre-fort depuis la page de détail
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safes.map((safe) => (
              <Link key={safe.id} href={`/safes/${safe.id}`}>
                <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] backdrop-blur-sm">
                  <h3 className="text-xl font-semibold text-white mb-2 tracking-wide">
                    {safe.name}
                  </h3>
                  {safe.description && (
                    <p className="text-slate-400 text-sm mb-4">
                      {safe.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">
                      {safe._count.transactions} transaction{safe._count.transactions !== 1 ? 's' : ''}
                    </span>
                    <span className="text-blue-400 font-medium">
                      Voir →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

