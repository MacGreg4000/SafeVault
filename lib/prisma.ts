import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let prismaInstance: PrismaClient

try {
  prismaInstance = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaInstance
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Prisma:', error)
  // En cas d'erreur, créer une instance vide pour éviter les crashes
  prismaInstance = globalForPrisma.prisma ?? ({} as PrismaClient)
}

export const prisma = prismaInstance

