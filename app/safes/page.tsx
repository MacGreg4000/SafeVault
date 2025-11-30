import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getSafes } from '@/app/actions/safe'
import { logoutAction } from '@/app/actions/auth'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-800">SafeGuard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {user.name} ({user.role})
              </span>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-red-600 hover:text-red-700"
                >
                  Déconnexion
                </button>
              </form>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            Mes coffres-forts
          </h2>
          <p className="text-gray-600">
            Gérez vos coffres-forts et suivez vos transactions
          </p>
        </div>

        {safes.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Aucun coffre-fort disponible</p>
            {user.role === 'ADMIN' && (
              <p className="text-sm text-gray-500">
                Créez votre premier coffre-fort depuis la page de détail
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {safes.map((safe, index) => (
              <motion.div
                key={safe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/safes/${safe.id}`}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 cursor-pointer">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {safe.name}
                    </h3>
                    {safe.description && (
                      <p className="text-gray-600 text-sm mb-4">
                        {safe.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {safe._count.transactions} transaction{safe._count.transactions !== 1 ? 's' : ''}
                      </span>
                      <span className="text-indigo-600 font-medium">
                        Voir →
                      </span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

