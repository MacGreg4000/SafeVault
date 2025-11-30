'use server'

import { authenticateUser, createUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@prisma/client'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'

export async function loginAction(email: string, password: string) {
  const user = await authenticateUser(email, password)
  if (!user) {
    return { error: 'Email ou mot de passe incorrect' }
  }

  // Stocker l'ID utilisateur dans un cookie (simple, pour production utiliser NextAuth)
  cookies().set('userId', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  })

  return { success: true, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
}

export async function logoutAction() {
  cookies().delete('userId')
  revalidatePath('/')
  return { success: true }
}

export async function getCurrentUser() {
  const userId = cookies().get('userId')?.value
  if (!userId) return null

  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true },
  })
}

export async function setupFirstAdmin(
  email: string,
  password: string,
  name: string,
  safeName: string,
  safeDescription?: string
) {
  // Vérifier que la DB est vide
  const isEmpty = await prisma.user.count() === 0
  if (!isEmpty) {
    return { error: 'La base de données n\'est pas vide' }
  }

  // Créer l'admin
  const admin = await createUser(email, password, name, UserRole.ADMIN)

  // Créer le premier coffre
  const safe = await prisma.safe.create({
    data: {
      name: safeName,
      description: safeDescription,
    },
  })

  // Donner tous les droits à l'admin sur ce coffre
  await prisma.userSafePermission.create({
    data: {
      userId: admin.id,
      safeId: safe.id,
      canRead: true,
      canWrite: true,
      canManage: true,
    },
  })

  // Créer l'inventaire initial vide
  await prisma.inventory.create({
    data: {
      safeId: safe.id,
      billDetails: {},
      totalAmount: 0,
    },
  })

  // Connecter l'admin
  cookies().set('userId', admin.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
  })

  return { success: true, admin, safe }
}

