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
        PUPPETEER_BROWSER_URL: 'http://localhost:3001',
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

