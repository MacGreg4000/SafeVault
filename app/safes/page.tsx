import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/app/actions/auth'
import { getSafes } from '@/app/actions/safe'
import Link from 'next/link'
import { Vault, TrendingUp } from 'lucide-react'

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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Mes coffres-forts
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Gérez vos coffres-forts et suivez vos transactions
          </p>
        </div>

        {safes.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 sm:p-12 text-center backdrop-blur-sm shadow-xl">
            <Vault className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 mb-2 text-lg font-semibold">Aucun coffre-fort disponible</p>
            {user.role === 'ADMIN' && (
              <p className="text-sm text-slate-500">
                Créez votre premier coffre-fort depuis la page de détail
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {safes.map((safe: any, index: number) => (
              <Link key={safe.id} href={`/safes/${safe.id}`}>
                <div
                  className="
                    relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 
                    border-2 border-slate-700/50 rounded-xl p-6 
                    cursor-pointer transition-all duration-500 ease-out
                    hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] 
                    hover:scale-105 hover:-translate-y-1
                    backdrop-blur-sm group
                  "
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Effet de glow au survol */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                          <Vault className="w-5 h-5 text-cyan-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white tracking-wide">
                          {safe.name}
                        </h3>
                      </div>
                    </div>
                    
                    {safe.description && (
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                        {safe.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                      <div className="flex items-center gap-2 text-slate-400">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {safe._count.transactions} transaction{safe._count.transactions !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <span className="text-cyan-400 font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Voir
                        <span className="text-lg">→</span>
                      </span>
                    </div>
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

