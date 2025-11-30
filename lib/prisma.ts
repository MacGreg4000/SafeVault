import { PrismaClient } from '@prisma/client'
import path from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Résoudre le chemin de la base de données de manière absolue
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    throw new Error('DATABASE_URL is not defined')
  }
  
  // Si c'est un chemin relatif (file:./...), le convertir en chemin absolu
  if (dbUrl.startsWith('file:./')) {
    const relativePath = dbUrl.replace('file:', '')
    const absolutePath = path.resolve(process.cwd(), relativePath)
    return `file:${absolutePath}`
  }
  
  return dbUrl
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

