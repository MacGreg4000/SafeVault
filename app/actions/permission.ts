'use server'

import { prisma } from '@/lib/prisma'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getUserPermissions(userId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  const permissions = await prisma.userSafePermission.findMany({
    where: { userId },
    include: {
      safe: {
        select: {
          id: true,
          name: true,
          description: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return { permissions }
}

export async function getAllSafes() {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  const safes = await prisma.safe.findMany({
    select: {
      id: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return { safes }
}

export async function updateUserPermission(
  userId: string,
  safeId: string,
  canRead: boolean,
  canWrite: boolean,
  canManage: boolean
) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  try {
    const permission = await prisma.userSafePermission.upsert({
      where: {
        userId_safeId: {
          userId,
          safeId,
        },
      },
      update: {
        canRead,
        canWrite,
        canManage,
      },
      create: {
        userId,
        safeId,
        canRead,
        canWrite,
        canManage,
      },
    })

    revalidatePath('/users')
    return { success: true, permission }
  } catch (error: any) {
    return { error: error.message || 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUserPermission(userId: string, safeId: string) {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  try {
    await prisma.userSafePermission.delete({
      where: {
        userId_safeId: {
          userId,
          safeId,
        },
      },
    })

    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Erreur lors de la suppression' }
  }
}

