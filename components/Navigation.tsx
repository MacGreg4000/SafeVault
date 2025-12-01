'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { logoutAction } from '@/app/actions/auth'
import { Vault, Users, LogOut, User, BarChart3, ChevronDown, Settings } from 'lucide-react'

interface NavigationProps {
  user: {
    name: string
    role: string
    email: string
  } | null
}

export default function Navigation({ user }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false)
      }
    }

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isMenuOpen])

  if (!user) {
    return null
  }

  const handleLogout = async () => {
    await logoutAction()
  }

  return (
    <nav className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link href="/safes" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Vault className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white tracking-wide">SafeGuard</h1>
            </Link>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href="/safes"
              className="flex items-center gap-2 px-3 py-2 text-sm text-blue-400 hover:text-blue-300 transition-all duration-300 hover:shadow-[0_0_10px_rgba(59,130,246,0.5)] rounded-lg hover:bg-blue-500/10"
              title="Coffres-forts"
            >
              <Vault className="w-4 h-4" />
              <span className="hidden sm:inline">Coffres</span>
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-lg hover:bg-cyan-500/10"
              title="Tableau de bord"
            >
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            {user.role === 'ADMIN' && (
              <Link
                href="/users"
                className="flex items-center gap-2 px-3 py-2 text-sm text-cyan-400 hover:text-cyan-300 transition-all duration-300 hover:shadow-[0_0_10px_rgba(6,182,212,0.5)] rounded-lg hover:bg-cyan-500/10"
                title="Gestion des utilisateurs"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Utilisateurs</span>
              </Link>
            )}
            
            {/* Menu déroulant élégant */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg bg-slate-800/50 border border-slate-700 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] group"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <User className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="hidden sm:flex flex-col items-start">
                  <span className="text-sm text-slate-200 font-medium">{user.name}</span>
                  <span className="text-xs text-slate-500">{user.role}</span>
                </div>
                <ChevronDown 
                  className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                    isMenuOpen ? 'rotate-180' : ''
                  }`} 
                />
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div 
                  className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 shadow-2xl overflow-hidden"
                  style={{
                    animation: 'fadeInUp 0.3s ease-out both'
                  }}
                >
                  {/* Header du menu */}
                  <div className="px-4 py-3 bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-500/30 border border-cyan-500/50 flex items-center justify-center">
                        <User className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                        <p className="text-xs text-slate-400 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {user.role}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Items du menu */}
                  <div className="py-2">
                    <div className="px-2 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider px-4">
                      Compte
                    </div>
                    
                    <button
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800/50 transition-all duration-200 group"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-800/50 flex items-center justify-center group-hover:bg-cyan-500/10 group-hover:border group-hover:border-cyan-500/20 transition-all">
                        <Settings className="w-4 h-4 text-slate-400 group-hover:text-cyan-400" />
                      </div>
                      <span>Paramètres</span>
                    </button>

                    <div className="h-px bg-slate-700/50 my-2 mx-4"></div>

                    <form action={handleLogout}>
                      <button
                        type="submit"
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 group"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 group-hover:border group-hover:border-red-500/30 transition-all">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>Déconnexion</span>
                      </button>
                    </form>
                  </div>
                </div>
      )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
