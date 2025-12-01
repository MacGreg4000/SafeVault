'use client'

import { useState, useEffect } from 'react'
import { createUserAction, updateUserRole, deleteUser } from '@/app/actions/user'
import { getUserPermissions, updateUserPermission, deleteUserPermission, getAllSafes } from '@/app/actions/permission'
import { UserRole } from '@/lib/auth'
import { Users, UserPlus, Shield, User as UserIcon, Trash2, Edit, Mail, Calendar, Vault, Eye, Pencil, Settings, X, Check } from 'lucide-react'
import { format } from 'date-fns'
import RoleSelect from '@/components/RoleSelect'

interface User {
  id: string
  email: string
  name: string
  role: string
  createdAt: Date
  _count: {
    transactions: number
    permissions: number
  }
}

interface Safe {
  id: string
  name: string
  description?: string | null
}

interface Permission {
  id: string
  safeId: string
  canRead: boolean
  canWrite: boolean
  canManage: boolean
  safe: {
    id: string
    name: string
    description?: string | null
  }
}

interface UsersClientProps {
  initialUsers: User[]
  safes: Safe[]
}

export default function UsersClient({ initialUsers, safes }: UsersClientProps) {
  const [users, setUsers] = useState(initialUsers)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null)
  const [userPermissions, setUserPermissions] = useState<Record<string, Permission[]>>({})
  const [editingPermission, setEditingPermission] = useState<{ userId: string; safeId: string } | null>(null)
  const [permissionForm, setPermissionForm] = useState({ canRead: true, canWrite: false, canManage: false })
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER',
  })

  const loadUserPermissions = async (userId: string) => {
    const result = await getUserPermissions(userId)
    if (result.permissions) {
      setUserPermissions(prev => ({ ...prev, [userId]: result.permissions }))
    }
  }

  const handleExpandUser = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null)
    } else {
      setExpandedUserId(userId)
      if (!userPermissions[userId]) {
        await loadUserPermissions(userId)
      }
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const result = await createUserAction(
        formData.email,
        formData.password,
        formData.name,
        formData.role
      )

      if (result.error) {
        setError(result.error)
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    setLoading(true)
    try {
      const result = await updateUserRole(userId, newRole)
      if (result.error) {
        alert(result.error)
      } else {
        setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      }
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteUser(userId)
      if (result.error) {
        alert(result.error)
      } else {
        setUsers(users.filter(u => u.id !== userId))
      }
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditPermission = (userId: string, safeId: string) => {
    const permissions = userPermissions[userId] || []
    const existing = permissions.find(p => p.safeId === safeId)
    setEditingPermission({ userId, safeId })
    setPermissionForm({
      canRead: existing?.canRead ?? true,
      canWrite: existing?.canWrite ?? false,
      canManage: existing?.canManage ?? false,
    })
  }

  const handleSavePermission = async () => {
    if (!editingPermission) return

    setLoading(true)
    try {
      const result = await updateUserPermission(
        editingPermission.userId,
        editingPermission.safeId,
        permissionForm.canRead,
        permissionForm.canWrite,
        permissionForm.canManage
      )

      if (result.error) {
        alert(result.error)
      } else {
        await loadUserPermissions(editingPermission.userId)
        setEditingPermission(null)
      }
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePermission = async (userId: string, safeId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
      return
    }

    setLoading(true)
    try {
      const result = await deleteUserPermission(userId, safeId)
      if (result.error) {
        alert(result.error)
      } else {
        await loadUserPermissions(userId)
      }
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleAddPermission = (userId: string) => {
    setEditingPermission({ userId, safeId: '' })
    setPermissionForm({ canRead: true, canWrite: false, canManage: false })
  }

  const handleSaveNewPermission = async () => {
    if (!editingPermission || !editingPermission.safeId) {
      alert('Veuillez sélectionner un coffre')
      return
    }

    setLoading(true)
    try {
      const result = await updateUserPermission(
        editingPermission.userId,
        editingPermission.safeId,
        permissionForm.canRead,
        permissionForm.canWrite,
        permissionForm.canManage
      )

      if (result.error) {
        alert(result.error)
      } else {
        await loadUserPermissions(editingPermission.userId)
        setEditingPermission(null)
      }
    } catch (err: any) {
      alert(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold text-white mb-2 tracking-wide flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Gestion des utilisateurs
          </h2>
          <p className="text-slate-400 text-sm">Gérez les utilisateurs et leurs permissions sur les coffres</p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105"
          >
            <UserPlus className="w-5 h-5" />
            {showCreateForm ? 'Annuler' : 'Nouvel utilisateur'}
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-6 backdrop-blur-sm shadow-xl">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Créer un nouvel utilisateur
            </h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Nom
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Rôle
                  </label>
                  <RoleSelect
                    value={formData.role as 'USER' | 'ADMIN'}
                    onChange={(value) => setFormData({ ...formData, role: value })}
                  />
                </div>
              </div>
              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Création...' : 'Créer l\'utilisateur'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-wide flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Liste des utilisateurs
          </h2>

          <div className="space-y-3">
            {users.map((user, index) => {
              const permissions = userPermissions[user.id] || []
              const isExpanded = expandedUserId === user.id
              const isEditingNew = editingPermission?.userId === user.id && editingPermission?.safeId === ''

              return (
                <div
                  key={user.id}
                  className="border-2 border-slate-700/50 rounded-xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all duration-500"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
                          <UserIcon className="w-6 h-6 text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-bold text-white">{user.name}</h3>
                            {user.role === 'ADMIN' && (
                              <Shield className="w-4 h-4 text-yellow-400" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(user.createdAt), 'dd/MM/yyyy')}
                            </span>
                            <span>{user._count.transactions} transactions</span>
                            <span>{permissions.length} coffre{permissions.length !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExpandUser(user.id)}
                          className="px-3 py-2 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-lg text-sm transition-all duration-300 flex items-center gap-2"
                        >
                          <Vault className="w-4 h-4" />
                          {isExpanded ? 'Masquer' : 'Permissions'}
                        </button>
                        <RoleSelect
                          value={user.role as 'USER' | 'ADMIN'}
                          onChange={(value) => handleUpdateRole(user.id, value)}
                          disabled={loading}
                          className="w-48"
                        />
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={loading}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300 disabled:opacity-50"
                          title="Supprimer"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-6 pt-6 border-t border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-white flex items-center gap-2">
                            <Vault className="w-5 h-5 text-cyan-400" />
                            Permissions sur les coffres
                          </h4>
                          {!isEditingNew && (
                            <button
                              onClick={() => handleAddPermission(user.id)}
                              className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-all duration-300 flex items-center gap-2"
                            >
                              <UserPlus className="w-4 h-4" />
                              Ajouter un coffre
                            </button>
                          )}
                        </div>

                        {isEditingNew && (
                          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 mb-4">
                            <h5 className="text-white font-semibold mb-3">Nouvelle permission</h5>
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-slate-300 mb-1">
                                  Coffre
                                </label>
                                <select
                                  value={editingPermission?.safeId || ''}
                                  onChange={(e) => setEditingPermission({ userId: user.id, safeId: e.target.value })}
                                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="">Sélectionner un coffre</option>
                                  {safes
                                    .filter(safe => !permissions.some(p => p.safeId === safe.id))
                                    .map(safe => (
                                      <option key={safe.id} value={safe.id}>{safe.name}</option>
                                    ))}
                                </select>
                              </div>
                              <div className="flex items-center gap-4">
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={permissionForm.canRead}
                                    onChange={(e) => setPermissionForm({ ...permissionForm, canRead: e.target.checked })}
                                    className="rounded"
                                  />
                                  <Eye className="w-4 h-4" />
                                  Lecture
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={permissionForm.canWrite}
                                    onChange={(e) => setPermissionForm({ ...permissionForm, canWrite: e.target.checked })}
                                    className="rounded"
                                  />
                                  <Pencil className="w-4 h-4" />
                                  Écriture
                                </label>
                                <label className="flex items-center gap-2 text-sm text-slate-300">
                                  <input
                                    type="checkbox"
                                    checked={permissionForm.canManage}
                                    onChange={(e) => setPermissionForm({ ...permissionForm, canManage: e.target.checked })}
                                    className="rounded"
                                  />
                                  <Settings className="w-4 h-4" />
                                  Gestion
                                </label>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleSaveNewPermission}
                                  disabled={loading}
                                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-2"
                                >
                                  <Check className="w-4 h-4" />
                                  Enregistrer
                                </button>
                                <button
                                  onClick={() => setEditingPermission(null)}
                                  className="px-4 py-2 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-all duration-300 flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Annuler
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {permissions.length === 0 && !isEditingNew ? (
                          <p className="text-slate-400 text-sm">Aucune permission attribuée</p>
                        ) : (
                          <div className="space-y-2">
                            {permissions.map((permission) => {
                              const isEditing = editingPermission?.userId === user.id && editingPermission?.safeId === permission.safeId

                              return (
                                <div
                                  key={permission.id}
                                  className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
                                >
                                  {isEditing ? (
                                    <div className="space-y-3">
                                      <div className="font-semibold text-white">{permission.safe.name}</div>
                                      <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 text-sm text-slate-300">
                                          <input
                                            type="checkbox"
                                            checked={permissionForm.canRead}
                                            onChange={(e) => setPermissionForm({ ...permissionForm, canRead: e.target.checked })}
                                            className="rounded"
                                          />
                                          <Eye className="w-4 h-4" />
                                          Lecture
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-300">
                                          <input
                                            type="checkbox"
                                            checked={permissionForm.canWrite}
                                            onChange={(e) => setPermissionForm({ ...permissionForm, canWrite: e.target.checked })}
                                            className="rounded"
                                          />
                                          <Pencil className="w-4 h-4" />
                                          Écriture
                                        </label>
                                        <label className="flex items-center gap-2 text-sm text-slate-300">
                                          <input
                                            type="checkbox"
                                            checked={permissionForm.canManage}
                                            onChange={(e) => setPermissionForm({ ...permissionForm, canManage: e.target.checked })}
                                            className="rounded"
                                          />
                                          <Settings className="w-4 h-4" />
                                          Gestion
                                        </label>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={handleSavePermission}
                                          disabled={loading}
                                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-500 transition-all duration-300 disabled:opacity-50 flex items-center gap-1"
                                        >
                                          <Check className="w-3 h-3" />
                                          Enregistrer
                                        </button>
                                        <button
                                          onClick={() => setEditingPermission(null)}
                                          className="px-3 py-1.5 bg-slate-700 text-white rounded-lg text-sm hover:bg-slate-600 transition-all duration-300 flex items-center gap-1"
                                        >
                                          <X className="w-3 h-3" />
                                          Annuler
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <Vault className="w-5 h-5 text-cyan-400" />
                                        <div>
                                          <div className="font-semibold text-white">{permission.safe.name}</div>
                                          <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                            {permission.canRead && (
                                              <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                Lecture
                                              </span>
                                            )}
                                            {permission.canWrite && (
                                              <span className="flex items-center gap-1">
                                                <Pencil className="w-3 h-3" />
                                                Écriture
                                              </span>
                                            )}
                                            {permission.canManage && (
                                              <span className="flex items-center gap-1">
                                                <Settings className="w-3 h-3" />
                                                Gestion
                                              </span>
                                            )}
                                            {!permission.canRead && !permission.canWrite && !permission.canManage && (
                                              <span className="text-slate-500">Aucune permission</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => handleStartEditPermission(user.id, permission.safeId)}
                                          className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-all duration-300"
                                          title="Modifier"
                                        >
                                          <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeletePermission(user.id, permission.safeId)}
                                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-300"
                                          title="Supprimer"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
