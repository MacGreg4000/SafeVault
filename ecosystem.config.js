module.exports = {
  apps: [
    {
      name: 'safeguard',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/path/to/SafeVault', // À modifier avec le chemin absolu de votre projet
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        HOSTNAME: '0.0.0.0',
        DATABASE_URL: 'file:./prisma/safeguard.db',
        PDF_SERVICE_URL: 'http://192.168.0.250:3001', // Utiliser l'IP du NAS au lieu de localhost
        PDF_SERVICE_PROVIDER: 'browserless',
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_file: './logs/combined.log',
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
    },
  ],
}

