'use server'

import { prisma } from '@/lib/prisma'
import { createUser, hashPassword, UserRole } from '@/lib/auth'
import { getCurrentUser } from './auth'
import { revalidatePath } from 'next/cache'

export async function getUsers() {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          transactions: true,
          permissions: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return { users }
}

export async function createUserAction(
  email: string,
  password: string,
  name: string,
  role: string
) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  // Vérifier si l'email existe déjà
  const existing = await prisma.user.findUnique({
    where: { email },
  })

  if (existing) {
    return { error: 'Cet email est déjà utilisé' }
  }

  try {
    const newUser = await createUser(email, password, name, role as UserRole)
    revalidatePath('/users')
    return { success: true, user: newUser }
  } catch (error: any) {
    return { error: error.message || 'Erreur lors de la création' }
  }
}

export async function updateUserRole(userId: string, role: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  if (user.id === userId) {
    return { error: 'Vous ne pouvez pas modifier votre propre rôle' }
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role },
    })
    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Erreur lors de la mise à jour' }
  }
}

export async function deleteUser(userId: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  if (user.id === userId) {
    return { error: 'Vous ne pouvez pas supprimer votre propre compte' }
  }

  try {
    await prisma.user.delete({
      where: { id: userId },
    })
    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Erreur lors de la suppression' }
  }
}

export async function resetUserPassword(userId: string, newPassword: string) {
  const user = await getCurrentUser()
  if (!user || user.role !== 'ADMIN') {
    return { error: 'Accès refusé' }
  }

  try {
    const passwordHash = await hashPassword(newPassword)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    })
    revalidatePath('/users')
    return { success: true }
  } catch (error: any) {
    return { error: error.message || 'Erreur lors de la réinitialisation' }
  }
}

