'use server'

import { prisma } from '@/lib/prisma'
import { calculateTotal, validateBillDetails, type BillDetails } from '@/lib/bills'
import { TransactionType, TransactionMode } from '@/lib/constants'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getSafes() {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  if (user.role === 'ADMIN') {
    const safes = await prisma.safe.findMany({
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return { safes }
  }

  const safes = await prisma.safe.findMany({
    where: {
      permissions: {
        some: {
          userId: user.id,
          canRead: true,
        },
      },
    },
    include: {
      _count: {
        select: { transactions: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { safes }
}

export async function getSafeById(safeId: string) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  const safe = await prisma.safe.findUnique({
    where: { id: safeId },
    include: {
      inventories: true,
      permissions: {
        where: { userId: user.id },
      },
    },
  })

  if (!safe) return { error: 'Coffre non trouvé' }

  // Vérifier les permissions
  if (user.role !== 'ADMIN' && safe.permissions.length === 0) {
    return { error: 'Accès refusé' }
  }

  return { safe }
}

export async function createTransaction(
  safeId: string,
  type: string,
  mode: string,
  billDetails: BillDetails,
  notes?: string
) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  // Vérifier les permissions
  const safe = await prisma.safe.findUnique({
    where: { id: safeId },
    include: {
      permissions: {
        where: { userId: user.id },
      },
    },
  })

  if (!safe) return { error: 'Coffre non trouvé' }

  const hasPermission = user.role === 'ADMIN' || 
    safe.permissions.some(p => p.canWrite || p.canManage)

  if (!hasPermission) {
    return { error: 'Permission refusée' }
  }

  // Valider les billets
  if (!validateBillDetails(billDetails)) {
    return { error: 'Détails des billets invalides' }
  }

  const amount = calculateTotal(billDetails)

  // Créer la transaction
  const transaction = await prisma.transaction.create({
    data: {
      safeId,
      userId: user.id,
      type,
      mode,
      amount,
      billDetails: JSON.stringify(billDetails),
      notes,
    },
  })

  // Mettre à jour l'inventaire
  const inventory = await prisma.inventory.findUnique({
    where: { safeId },
  })

  if (!inventory) {
    return { error: 'Inventaire non trouvé' }
  }

  const currentBills: BillDetails = inventory.billDetails ? JSON.parse(inventory.billDetails) : {}
  let newBills: BillDetails = { ...currentBills }

  if (type === TransactionType.INVENTORY || mode === TransactionMode.REPLACE) {
    // Remplacement complet
    newBills = billDetails
  } else if (mode === TransactionMode.ADD) {
    // Ajout
    Object.keys(billDetails).forEach((value) => {
      newBills[value] = (newBills[value] || 0) + billDetails[value]
    })
  } else if (mode === TransactionMode.REMOVE) {
    // Retrait
    Object.keys(billDetails).forEach((value) => {
      const current = newBills[value] || 0
      const toRemove = billDetails[value]
      if (current < toRemove) {
        throw new Error(`Quantité insuffisante pour les billets de ${value}€`)
      }
      newBills[value] = current - toRemove
      if (newBills[value] === 0) {
        delete newBills[value]
      }
    })
  }

  const newTotal = calculateTotal(newBills)

  await prisma.inventory.update({
    where: { safeId },
    data: {
      billDetails: JSON.stringify(newBills),
      totalAmount: newTotal,
      updatedAt: new Date(),
    },
  })

  revalidatePath(`/safes/${safeId}`)
  revalidatePath('/safes')

  return { success: true, transaction }
}

export async function getTransactions(safeId: string, limit: number = 50) {
  const user = await getCurrentUser()
  if (!user) return { error: 'Non authentifié' }

  const transactions = await prisma.transaction.findMany({
    where: { safeId },
    include: {
      user: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  })

  return { transactions }
}

