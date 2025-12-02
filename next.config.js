/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
      allowedOrigins: ['localhost:3003', 'localhost:3000'],
    },
  },
  // S'assurer que Prisma est inclus dans le build standalone
  serverExternalPackages: [],
}

module.exports = nextConfig

