'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { createTransaction } from '@/app/actions/safe'
import { TransactionType, TransactionMode } from '@/lib/constants'
import { BILL_VALUES, calculateTotal, type BillDetails } from '@/lib/bills'
import { format } from 'date-fns'

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

  const handleExportPDF = async (transaction: any) => {
    try {
      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transactionId: transaction.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erreur lors de la génération du PDF')
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `transaction-${transaction.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      alert('Erreur lors de la génération du PDF: ' + err.message)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/safes" className="text-indigo-600 hover:text-indigo-700">
              ← Retour
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">{safe.name}</h1>
            <div></div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Inventaire actuel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Inventaire actuel
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
            {BILL_VALUES.map((value) => {
              const quantity = currentBills[value.toString()] || 0
              const total = value * quantity
              return (
                <div
                  key={value}
                  className="border rounded-lg p-4 text-center bg-gray-50"
                >
                  <div className="text-sm text-gray-600 mb-1">{value}€</div>
                  <div className="text-2xl font-bold text-gray-800">
                    {quantity}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {total.toFixed(2)}€
                  </div>
                </div>
              )
            })}
          </div>
          <div className="border-t pt-4">
            <div className="text-right">
              <span className="text-lg text-gray-600">Total: </span>
              <span className="text-3xl font-bold text-indigo-600">
                {inventory?.totalAmount.toFixed(2) || '0.00'}€
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {hasWritePermission && (
          <div className="mb-6">
            <button
              onClick={() => setShowTransactionForm(!showTransactionForm)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              {showTransactionForm ? 'Annuler' : '+ Nouvelle transaction'}
            </button>
          </div>
        )}

        {/* Formulaire de transaction */}
        {showTransactionForm && hasWritePermission && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-white rounded-lg shadow-md p-6 mb-6"
          >
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Nouvelle transaction
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) =>
                      setTransactionType(e.target.value as TransactionType)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value={TransactionType.MOVEMENT}>Mouvement</option>
                    <option value={TransactionType.INVENTORY}>Inventaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mode
                  </label>
                  <select
                    value={transactionMode}
                    onChange={(e) =>
                      setTransactionMode(e.target.value as TransactionMode)
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Billets
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                  {BILL_VALUES.map((value) => (
                    <div key={value} className="border rounded-lg p-3">
                      <div className="text-sm text-gray-600 mb-1">{value}€</div>
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
                        className="w-full px-2 py-1 border border-gray-300 rounded text-center"
                        placeholder="0"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right text-sm text-gray-600">
                  Total: {calculateTotal(billDetails).toFixed(2)}€
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (optionnel)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Enregistrement...' : 'Enregistrer la transaction'}
              </button>
            </form>
          </motion.div>
        )}

        {/* Historique des transactions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Historique des transactions
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-600">Aucune transaction enregistrée</p>
          ) : (
            <div className="space-y-4">
              {transactions.map((transaction) => (
                <motion.div
                  key={transaction.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-semibold text-gray-800">
                        {transaction.type} - {transaction.mode}
                      </div>
                      <div className="text-sm text-gray-600">
                        Par {transaction.user.name} le{' '}
                        {format(
                          new Date(transaction.createdAt),
                          'dd/MM/yyyy HH:mm'
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-indigo-600">
                        {transaction.amount.toFixed(2)}€
                      </div>
                      <button
                        onClick={() => handleExportPDF(transaction)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 mt-1"
                      >
                        Exporter PDF
                      </button>
                    </div>
                  </div>
                  {transaction.notes && (
                    <div className="text-sm text-gray-600 mt-2">
                      {transaction.notes}
                    </div>
                  )}
                  <div className="mt-2 text-xs text-gray-500">
                    {Object.entries(
                      typeof transaction.billDetails === 'string'
                        ? (JSON.parse(transaction.billDetails) as BillDetails)
                        : (transaction.billDetails as BillDetails)
                    )
                      .filter(([_, qty]) => (qty as number) > 0)
                      .map(([value, qty]) => `${qty as number}x ${value}€`)
                      .join(', ')}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

