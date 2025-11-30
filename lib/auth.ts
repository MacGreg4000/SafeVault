import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
} as const

export type UserRole = typeof UserRole[keyof typeof UserRole]

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(
  email: string,
  password: string,
  name: string,
  role: string = UserRole.USER
) {
  const passwordHash = await hashPassword(password)
  return prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role,
    },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
  })
}

export async function authenticateUser(email: string, password: string) {
  const user = await getUserByEmail(email)
  if (!user) return null

  const isValid = await verifyPassword(password, user.passwordHash)
  if (!isValid) return null

  return user
}

export async function isDatabaseEmpty(): Promise<boolean> {
  const userCount = await prisma.user.count()
  return userCount === 0
}

