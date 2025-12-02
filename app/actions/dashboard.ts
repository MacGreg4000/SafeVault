'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { BILL_VALUES } from '@/lib/bills'

export async function getAccessibleSafes() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  let safes
  
  if (user.role === 'ADMIN') {
    safes = await prisma.safe.findMany({
      select: { id: true, name: true, description: true },
      orderBy: { name: 'asc' },
    })
  } else {
    const permissions = await prisma.userSafePermission.findMany({
      where: {
        userId: user.id,
        canRead: true,
      },
      include: {
        safe: {
          select: { id: true, name: true, description: true },
        },
      },
    })
    safes = permissions.map((p: any) => p.safe)
  }

  return { safes: safes || [] }
}

export async function getDashboardData(safeId?: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  // Récupérer les coffres accessibles par l'utilisateur
  let accessibleSafeIds: string[] = []
  
  if (user.role === 'ADMIN') {
    const allSafes = await prisma.safe.findMany({
      select: { id: true },
    })
    accessibleSafeIds = allSafes.map((s: { id: string }) => s.id)
  } else {
    const permissions = await prisma.userSafePermission.findMany({
      where: {
        userId: user.id,
        canRead: true,
      },
      select: { safeId: true },
    })
    accessibleSafeIds = permissions.map((p: { safeId: string }) => p.safeId)
  }

  if (accessibleSafeIds.length === 0) {
    return {
      transactions: [],
      totalAmount: 0,
      transactionCount: 0,
      billEvolution: {},
    }
  }

  // Si un safeId est spécifié, filtrer uniquement ce coffre
  const safeIdsToQuery = safeId && accessibleSafeIds.includes(safeId) 
    ? [safeId] 
    : accessibleSafeIds

  // Récupérer toutes les transactions des coffres accessibles
  // IMPORTANT: On affiche TOUTES les transactions des coffres accessibles, pas seulement celles de l'utilisateur
  // Cela permet de voir l'activité globale de tous les coffres auxquels l'utilisateur a accès
  const transactions = await prisma.transaction.findMany({
    where: {
      safeId: { in: safeIdsToQuery },
      // On ne filtre PAS par userId pour voir toutes les transactions des coffres accessibles
    },
    include: {
      safe: {
        select: { name: true },
      },
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Calculer l'évolution des montants dans le temps
  const amountEvolution = transactions.map((t: any) => ({
    date: t.createdAt.toISOString().split('T')[0],
    amount: t.amount,
    type: t.type,
    mode: t.mode,
  }))

  // Calculer l'évolution du nombre de chaque billet
  // IMPORTANT: On traite chaque coffre séparément pour éviter de mélanger les inventaires
  const billEvolution: Record<string, Record<string, number>> = {}
  
  // Initialiser pour chaque valeur de billet
  BILL_VALUES.forEach((value: number) => {
    billEvolution[value.toString()] = {}
  })

  // Récupérer les IDs uniques des coffres pour traiter séparément
  const uniqueSafeIds = [...new Set(transactions.map((t: any) => t.safeId))] as string[]
  
  // Pour chaque coffre, calculer l'évolution des billets séparément puis agréger
  uniqueSafeIds.forEach((safeId: string) => {
    const safeTransactions = transactions
      .filter((t: any) => t.safeId === safeId)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    
    let currentBills: Record<string, number> = {}
    
    safeTransactions.forEach((transaction: any) => {
      const billDetails = typeof transaction.billDetails === 'string'
        ? JSON.parse(transaction.billDetails)
        : transaction.billDetails

      const date = transaction.createdAt.toISOString().split('T')[0]

      // Mettre à jour les billets selon le type et mode
      if (transaction.type === 'INVENTORY' || transaction.mode === 'REPLACE') {
        currentBills = { ...billDetails }
      } else if (transaction.mode === 'ADD') {
        Object.keys(billDetails).forEach((value: string) => {
          currentBills[value] = (currentBills[value] || 0) + billDetails[value]
        })
      } else if (transaction.mode === 'REMOVE') {
        Object.keys(billDetails).forEach((value: string) => {
          currentBills[value] = (currentBills[value] || 0) - billDetails[value]
          if (currentBills[value] <= 0) {
            delete currentBills[value]
          }
        })
      }

      // Enregistrer l'état pour chaque valeur de billet (agrégation de tous les coffres)
      BILL_VALUES.forEach((value: number) => {
        const valueStr = value.toString()
        if (!billEvolution[valueStr][date]) {
          billEvolution[valueStr][date] = 0
        }
        // On additionne les quantités de tous les coffres pour cette date
        billEvolution[valueStr][date] += currentBills[valueStr] || 0
      })
    })
  })

  // Calculer le total actuel en parcourant toutes les transactions PAR COFFRE
  // et en reconstruisant l'état final pour chaque coffre, puis en agrégeant
  const finalBillsBySafe: Record<string, Record<string, number>> = {}
  
  // Grouper et traiter par coffre (utiliser uniqueSafeIds déjà défini plus haut)
  uniqueSafeIds.forEach((safeId: string) => {
    const safeTransactions = transactions.filter((t: any) => t.safeId === safeId).sort((a: any, b: any) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
    let finalBills: Record<string, number> = {}
    
    safeTransactions.forEach((transaction: any) => {
      const billDetails = typeof transaction.billDetails === 'string'
        ? JSON.parse(transaction.billDetails)
        : transaction.billDetails

      if (transaction.type === 'INVENTORY' || transaction.mode === 'REPLACE') {
        finalBills = { ...billDetails }
      } else if (transaction.mode === 'ADD') {
        Object.keys(billDetails).forEach((value: string) => {
          finalBills[value] = (finalBills[value] || 0) + billDetails[value]
        })
      } else if (transaction.mode === 'REMOVE') {
        Object.keys(billDetails).forEach((value: string) => {
          finalBills[value] = (finalBills[value] || 0) - billDetails[value]
          if (finalBills[value] <= 0) {
            delete finalBills[value]
          }
        })
      }
    })
    
    finalBillsBySafe[safeId] = finalBills
  })

  // Agréger les totaux de tous les coffres
  const aggregatedFinalBills: Record<string, number> = {}
  Object.values(finalBillsBySafe).forEach((safeBills: Record<string, number>) => {
    Object.entries(safeBills).forEach(([value, quantity]: [string, number]) => {
      aggregatedFinalBills[value] = (aggregatedFinalBills[value] || 0) + quantity
    })
  })

  // Calculer le total à partir des billets finaux agrégés
  const totalAmount = Object.entries(aggregatedFinalBills).reduce((sum, [value, quantity]) => {
    return sum + parseFloat(value) * quantity
  }, 0)

  return {
    transactions: amountEvolution,
    totalAmount,
    transactionCount: transactions.length,
    billEvolution,
  }
}

