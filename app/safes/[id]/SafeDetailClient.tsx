'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createTransaction } from '@/app/actions/safe'
import { TransactionType, TransactionMode } from '@/lib/constants'
import { BILL_VALUES, calculateTotal, type BillDetails } from '@/lib/bills'
import { format } from 'date-fns'
import { ArrowLeft, Vault, FileText, Download, Loader2 } from 'lucide-react'

interface SafeDetailClientProps {
  safe: any
  transactions: any[]
  currentUser: any
  hasWritePermission: boolean
}

export default function SafeDetailClient({
  safe,
  transactions: initialTransactions,
  currentUser,
  hasWritePermission,
}: SafeDetailClientProps) {
  const [transactions, setTransactions] = useState(initialTransactions)
  const [showTransactionForm, setShowTransactionForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exportingPDF, setExportingPDF] = useState<string | null>(null) // ID de la transaction en cours d'export
  const [transactionType, setTransactionType] = useState<TransactionType>(
    TransactionType.MOVEMENT
  )
  const [transactionMode, setTransactionMode] = useState<TransactionMode>(
    TransactionMode.ADD
  )
  const [billDetails, setBillDetails] = useState<BillDetails>({})
  const [notes, setNotes] = useState('')

  const inventory = safe.inventories?.[0] || null
  const currentBills: BillDetails = inventory?.billDetails ? JSON.parse(inventory.billDetails) : {}

  const handleBillChange = (value: number, quantity: number) => {
    setBillDetails((prev) => {
      const newDetails = { ...prev }
      if (quantity === 0) {
        delete newDetails[value.toString()]
      } else {
        newDetails[value.toString()] = quantity
      }
      return newDetails
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const total = calculateTotal(billDetails)
    if (total === 0) {
      setError('Veuillez saisir au moins un billet')
      setLoading(false)
      return
    }

    try {
      const result = await createTransaction(
        safe.id,
        transactionType,
        transactionMode,
        billDetails,
        notes || undefined
      )

      if (result.error) {
        setError(result.error)
      } else {
        // Recharger la page pour voir les nouvelles données
        window.location.reload()
      }
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  const handleExportPDF = async (e: React.MouseEvent, transaction: any) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (exportingPDF === transaction.id) {
      return // Déjà en cours d'export
    }

    setExportingPDF(transaction.id)
    
    try {
      console.log('[PDF Export] Début de l\'export PDF pour la transaction:', transaction.id)
      
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId: transaction.id }),
      })

      console.log('[PDF Export] Réponse reçue:', response.status, response.statusText)

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          // Si la réponse n'est pas du JSON, utiliser le texte
          const text = await response.text().catch(() => '')
          errorMessage = text || errorMessage
        }
        console.error('[PDF Export] Erreur:', errorMessage)
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      console.log('[PDF Export] Blob créé, taille:', blob.size, 'bytes')
      
      if (blob.size === 0) {
        throw new Error('Le PDF généré est vide')
      }

      // Vérifier que c'est bien un PDF
      if (blob.type !== 'application/pdf') {
        console.warn('[PDF Export] Type de fichier inattendu:', blob.type)
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transaction-${transaction.id}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('[PDF Export] PDF téléchargé avec succès')
    } catch (err: any) {
      console.error('[PDF Export] Erreur complète:', err)
      const errorMessage = err.message || 'Erreur inconnue lors de la génération du PDF'
      alert(`Erreur lors de la génération du PDF:\n\n${errorMessage}\n\nVérifiez que le service Browserless est démarré et accessible.`)
    } finally {
      setExportingPDF(null)
    }
  }

  const handleExportInventoryPDF = async () => {
    if (exportingPDF === 'inventory') {
      return
    }

    setExportingPDF('inventory')
    
    try {
      console.log('[PDF Export] Début de l\'export PDF pour l\'inventaire')
      
      const response = await fetch('/api/export-inventory-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ safeId: safe.id }),
      })

      if (!response.ok) {
        let errorMessage = `Erreur HTTP ${response.status}`
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (e) {
          const text = await response.text().catch(() => '')
          errorMessage = text || errorMessage
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      
      if (blob.size === 0) {
        throw new Error('Le PDF généré est vide')
      }

      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `inventaire-${safe.name}-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      console.log('[PDF Export] PDF inventaire téléchargé avec succès')
    } catch (err: any) {
      console.error('[PDF Export] Erreur complète:', err)
      const errorMessage = err.message || 'Erreur inconnue lors de la génération du PDF'
      alert(`Erreur lors de la génération du PDF:\n\n${errorMessage}\n\nVérifiez que le service Browserless est démarré et accessible.`)
    } finally {
      setExportingPDF(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900/50 border-b border-slate-800 backdrop-blur-sm sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link 
              href="/safes" 
              className="flex items-center justify-center w-10 h-10 text-blue-400 hover:text-blue-300 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] rounded-lg hover:bg-blue-500/10 border border-blue-500/30 hover:border-blue-500/50"
              title="Retour aux coffres"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-3">
              <Vault className="w-5 h-5 text-cyan-400 hidden sm:block" />
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">{safe.name}</h1>
            </div>
            <div></div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inventaire actuel */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-6 backdrop-blur-sm shadow-xl">
          <h2 className="text-3xl font-bold text-white mb-6 tracking-wide flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            Inventaire actuel
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            {BILL_VALUES.map((value, index) => {
              const quantity = currentBills[value.toString()] || 0
              const total = value * quantity
              const hasBills = quantity > 0
              return (
                <div
                  key={value}
                  className={`
                    relative border-2 rounded-xl p-5 text-center 
                    transition-all duration-500 ease-out
                    ${hasBills 
                      ? 'bg-gradient-to-br from-slate-800/80 to-slate-900/80 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:border-cyan-400 hover:shadow-[0_0_30px_rgba(6,182,212,0.6)] hover:scale-110 hover:-translate-y-1' 
                      : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600 hover:shadow-[0_0_15px_rgba(148,163,184,0.2)] hover:scale-105'
                    }
                    backdrop-blur-sm
                    group
                  `}
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Effet de glow animé pour les billets présents */}
                  {hasBills && (
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/20 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                  )}
                  
                  <div className="relative z-10">
                    <div className={`text-sm font-semibold mb-2 ${hasBills ? 'text-cyan-400' : 'text-slate-500'}`}>
                      {value}€
                    </div>
                    <div className={`
                      text-4xl font-bold mb-2 transition-all duration-300
                      ${hasBills ? 'text-white drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]' : 'text-slate-600'}
                    `}>
                      {quantity}
                    </div>
                    <div className={`
                      text-sm font-medium transition-all duration-300
                      ${hasBills ? 'text-cyan-300' : 'text-slate-500'}
                    `}>
                      {total.toFixed(2)}€
                    </div>
                  </div>
                  
                  {/* Indicateur visuel pour les billets présents */}
                  {hasBills && (
                    <div className="absolute top-2 right-2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(6,182,212,1)]"></div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="border-t border-slate-700/50 pt-6 mt-4">
            <div className="flex items-center justify-between bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-lg p-6 border border-slate-700/50 shadow-lg">
              <div className="text-lg font-semibold text-slate-300 uppercase tracking-wider">
                Total en caisse
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl text-slate-400">€</span>
                <span className="text-5xl font-bold text-gold drop-shadow-[0_0_20px_rgba(252,211,77,0.6)]">
                  {inventory?.totalAmount.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {hasWritePermission && (
          <div className="mb-6 flex items-center gap-4">
            <button
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-500 hover:to-cyan-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] hover:scale-105 border border-blue-500/30"
            >
              <FileText className="w-5 h-5" />
              {showTransactionForm ? 'Annuler' : 'Nouvelle transaction'}
            </button>
            {inventory && (
              <button
                onClick={() => handleExportInventoryPDF()}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-cyan-500 hover:to-teal-500 transition-all duration-300 hover:shadow-[0_0_20px_rgba(6,182,212,0.6)] hover:scale-105 border border-cyan-500/30"
                title="Exporter l&apos;inventaire en PDF"
                disabled={exportingPDF === 'inventory'}
              >
                {exportingPDF === 'inventory' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    Exporter l&apos;inventaire
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Formulaire de transaction */}
        {showTransactionForm && hasWritePermission && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-6 mb-6 backdrop-blur-sm transition-all duration-300">
            <h3 className="text-xl font-semibold text-white mb-4 tracking-wide">
              Nouvelle transaction
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Type
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) =>
                      setTransactionType(e.target.value as TransactionType)
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    <option value={TransactionType.MOVEMENT}>Mouvement</option>
                    <option value={TransactionType.INVENTORY}>Inventaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Mode
                  </label>
                  <select
                    value={transactionMode}
                    onChange={(e) =>
                      setTransactionMode(e.target.value as TransactionMode)
                    }
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  >
                    {transactionType === TransactionType.INVENTORY ? (
                      <option value={TransactionMode.REPLACE}>Remplacement</option>
                    ) : (
                      <>
                        <option value={TransactionMode.ADD}>Ajout (+)</option>
                        <option value={TransactionMode.REMOVE}>Retrait (-)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Billets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {BILL_VALUES.map((value) => (
                    <div key={value} className="border border-slate-700 rounded-lg p-3 bg-slate-800/50 hover:border-blue-500 hover:shadow-[0_0_10px_rgba(59,130,246,0.3)] transition-all duration-300">
                      <div className="text-sm text-slate-400 mb-1">{value}€</div>
                      <input
                        type="number"
                        min="0"
                        value={billDetails[value.toString()] || ''}
                        onChange={(e) =>
                          handleBillChange(
                            value,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 text-white rounded text-center focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm text-slate-300">
                  Total: <span className="text-gold font-semibold">{calculateTotal(billDetails).toFixed(2)}€</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-500 transition-all duration-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] hover:scale-105 disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer la transaction'}
              </button>
            </form>
          </div>
        )}

        {/* Historique des transactions */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 sm:p-8 backdrop-blur-sm shadow-xl">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 tracking-wide flex items-center gap-3">
            <span className="w-1 h-8 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></span>
            <FileText className="w-6 h-6 text-cyan-400" />
            Historique des transactions
          </h2>
          {transactions.length === 0 ? (
            <p className="text-slate-400">Aucune transaction enregistrée</p>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {transactions.map((transaction, index) => {
                const billDetails = typeof transaction.billDetails === 'string'
                  ? (JSON.parse(transaction.billDetails) as BillDetails)
                  : (transaction.billDetails as BillDetails)
                return (
                  <div
                    key={transaction.id}
                    className="
                      relative border-2 border-slate-700/50 rounded-xl p-4 sm:p-5 
                      bg-gradient-to-br from-slate-800/50 to-slate-900/50
                      hover:border-cyan-500/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] 
                      transition-all duration-500 ease-out
                      hover:scale-[1.02] hover:-translate-y-0.5
                      backdrop-blur-sm group
                    "
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: 'fadeInUp 0.6s ease-out forwards'
                    }}
                  >
                    {/* Effet de glow au survol */}
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    
                    <div className="relative z-10">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`
                              px-2 py-1 rounded text-xs font-bold
                              ${transaction.type === 'INVENTORY' 
                                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              }
                            `}>
                              {transaction.type}
                            </div>
                            <div className="px-2 py-1 rounded text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600">
                              {transaction.mode}
                            </div>
                          </div>
                          <div className="text-sm text-slate-400 flex items-center gap-1">
                            <span>Par {transaction.user.name}</span>
                            <span className="text-slate-600">•</span>
                            <span>{format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                          <div className="text-2xl sm:text-3xl font-bold text-gold drop-shadow-[0_0_10px_rgba(252,211,77,0.5)]">
                            {transaction.amount.toFixed(2)}€
                          </div>
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              handleExportPDF(e, transaction)
                            }}
                            disabled={exportingPDF === transaction.id}
                            className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-all duration-300 hover:shadow-[0_0_5px_rgba(59,130,246,0.5)] px-2 py-1 rounded hover:bg-blue-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Télécharger le PDF"
                          >
                            {exportingPDF === transaction.id ? (
                              <>
                                <span className="animate-spin">⏳</span>
                                <span className="hidden sm:inline">Génération...</span>
                              </>
                            ) : (
                              <>
                                <Download className="w-3 h-3" />
                                <span className="hidden sm:inline">PDF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {transaction.notes && (
                        <div className="text-sm text-slate-300 mt-3 p-2 bg-slate-800/30 rounded border border-slate-700/50">
                          {transaction.notes}
                        </div>
                      )}
                      
                      <div className="mt-3 pt-3 border-t border-slate-700/50">
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(billDetails)
                            .filter(([_, qty]) => (qty as number) > 0)
                            .map(([value, qty]) => (
                              <span
                                key={value}
                                className="px-2 py-1 text-xs font-medium bg-cyan-500/10 text-cyan-300 rounded border border-cyan-500/30"
                              >
                                {qty as number}x {value}€
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

