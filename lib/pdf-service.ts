import puppeteerCore from 'puppeteer-core'

// Essayer d'importer puppeteer pour le fallback local (optionnel)
let puppeteerLocal: any = null
try {
  puppeteerLocal = require('puppeteer')
} catch (e) {
  // puppeteer n'est pas installé, on utilisera uniquement puppeteer-core
  console.log('[PDF Service] Puppeteer local non disponible, utilisation uniquement du service réseau')
}

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL || process.env.PUPPETEER_BROWSER_URL || 'http://192.168.0.250:3001'
const PDF_SERVICE_PROVIDER = process.env.PDF_SERVICE_PROVIDER || 'browserless'
const USE_LOCAL_FALLBACK = process.env.PDF_USE_LOCAL_FALLBACK !== 'false' // Par défaut true

export interface PDFOptions {
  format?: 'A4' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

async function getBrowserWebSocketURL(): Promise<string> {
  // Extraire le token de l'URL ou de l'environnement
  let token: string | null = null
  let baseUrl = PDF_SERVICE_URL
  
  try {
    const url = new URL(PDF_SERVICE_URL)
    token = url.searchParams.get('token') || process.env.PDF_SERVICE_TOKEN || null
    // Reconstruire l'URL sans le token pour les requêtes
    url.searchParams.delete('token')
    baseUrl = url.toString()
  } catch (e) {
    // Si l'URL n'est pas valide, utiliser tel quel
    token = process.env.PDF_SERVICE_TOKEN || null
  }

  // Pour Browserless, essayer d'abord /json/version
  if (PDF_SERVICE_PROVIDER === 'browserless') {
    try {
      const versionUrl = `${baseUrl}/json/version`
      console.log(`[PDF Service] Tentative de connexion à: ${versionUrl}`)
      
      const response = await fetch(versionUrl, {
        signal: AbortSignal.timeout(5000), // Timeout de 5 secondes
        headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log(`[PDF Service] Réponse de /json/version:`, data)
        
        if (data.webSocketDebuggerUrl) {
          let wsUrl = data.webSocketDebuggerUrl
          // Ajouter le token à l'URL WebSocket si nécessaire
          if (token) {
            try {
              const wsUrlObj = new URL(wsUrl)
              wsUrlObj.searchParams.set('token', token)
              wsUrl = wsUrlObj.toString()
            } catch (e) {
              wsUrl = `${wsUrl}${wsUrl.includes('?') ? '&' : '?'}token=${token}`
            }
          }
          console.log(`[PDF Service] URL WebSocket depuis /json/version: ${wsUrl}`)
          return wsUrl
        }
      }
    } catch (error: any) {
      console.warn('[PDF Service] /json/version non disponible, utilisation de l\'URL WebSocket directe:', error.message)
    }
    
    // Fallback pour Browserless : construire directement l'URL WebSocket
    // Browserless utilise généralement ws://host:port pour la connexion WebSocket
    const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://')
    const finalWsUrl = token ? `${wsUrl}?token=${token}` : wsUrl
    console.log(`[PDF Service] URL WebSocket directe pour Browserless: ${finalWsUrl}`)
    return finalWsUrl
  }

  // Pour les autres providers (Chrome/Chromium standard)
  try {
    const versionUrl = `${baseUrl}/json/version`
    console.log(`[PDF Service] Tentative de connexion à: ${versionUrl}`)
    
    const response = await fetch(versionUrl, {
      signal: AbortSignal.timeout(10000),
      headers: token ? { 'Authorization': `Bearer ${token}` } : undefined,
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log(`[PDF Service] Réponse de /json/version:`, data)
    
    if (data.webSocketDebuggerUrl) {
      return data.webSocketDebuggerUrl
    }
    
    if (data.webSocketUrl) {
      return data.webSocketUrl
    }
    
    throw new Error('Aucune URL WebSocket trouvée dans la réponse')
  } catch (error: any) {
    console.error('[PDF Service] Erreur lors de la récupération de l\'URL WebSocket:', error)
    
    if (error.code === 'ECONNREFUSED' || error.cause?.code === 'ECONNREFUSED') {
      throw new Error(
        `Impossible de se connecter au service PDF sur ${PDF_SERVICE_URL}. ` +
        `Vérifiez que le service est démarré et accessible. ` +
        `Pour Browserless: docker run -p 3001:3000 ghcr.io/browserless/chromium`
      )
    }
    
    throw error
  }
}

async function generatePDFWithNetworkService(html: string, options: PDFOptions = {}) {
  // Essayer de se connecter au service Browserless en réseau
  const wsUrl = await getBrowserWebSocketURL()
  
  const browser = await puppeteerCore.connect({
    browserWSEndpoint: wsUrl,
  })

  try {
    const page = await browser.newPage()
    
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    const pdf = await page.pdf({
      format: options.format || 'A4',
      margin: options.margin || {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
    })

    await page.close()
    return pdf
  } finally {
    // Ne pas fermer le browser car il est partagé
    // await browser?.close()
  }
}

async function generatePDFWithLocalPuppeteer(html: string, options: PDFOptions = {}) {
  if (!puppeteerLocal) {
    throw new Error('Puppeteer local n\'est pas disponible. Installez-le avec: npm install puppeteer')
  }

  console.log('[PDF Service] Utilisation de Puppeteer local (fallback)')
  
  const browser = await puppeteerLocal.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-extensions',
      '--disable-web-security',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  })

  try {
    const page = await browser.newPage()
    
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 10000
    })

    const pdf = await page.pdf({
      format: options.format || 'A4',
      margin: options.margin || {
        top: '15mm',
        right: '15mm',
        bottom: '15mm',
        left: '15mm',
      },
      printBackground: true,
      preferCSSPageSize: true,
    })

    await page.close()
    return pdf
  } finally {
    await browser.close()
  }
}

export async function generatePDF(html: string, options: PDFOptions = {}) {
  let lastError: any = null
  
  // Essayer d'abord avec le service réseau (Browserless)
  try {
    console.log('[PDF Service] Tentative de génération PDF via service réseau (Browserless)')
    return await generatePDFWithNetworkService(html, options)
  } catch (error: any) {
    console.warn('[PDF Service] Échec de la génération via service réseau:', error.message)
    lastError = error
    
    // Si le fallback local est activé et que Puppeteer local est disponible, essayer en local
    if (USE_LOCAL_FALLBACK && puppeteerLocal) {
      try {
        console.log('[PDF Service] Tentative de génération PDF via Puppeteer local (fallback)')
        return await generatePDFWithLocalPuppeteer(html, options)
      } catch (localError: any) {
        console.error('[PDF Service] Échec de la génération via Puppeteer local:', localError.message)
        // Si les deux échouent, on garde l'erreur du service réseau comme erreur principale
      }
    }
    
    // Si on arrive ici, toutes les tentatives ont échoué
    const serviceUrl = PDF_SERVICE_URL || 'http://192.168.0.250:3001'
    
    // Extraire le message d'erreur de manière plus robuste
    let errorMessage = 'Erreur inconnue'
    if (lastError?.message) {
      errorMessage = lastError.message
    } else if (typeof lastError === 'string') {
      errorMessage = lastError
    } else if (lastError?.toString && lastError.toString() !== '[object Object]') {
      errorMessage = lastError.toString()
    } else {
      try {
        errorMessage = JSON.stringify(lastError, Object.getOwnPropertyNames(lastError))
      } catch (e) {
        errorMessage = 'Erreur lors de la connexion au service PDF'
      }
    }
    
    const fallbackInfo = USE_LOCAL_FALLBACK && puppeteerLocal 
      ? ' Le fallback local a également échoué.' 
      : ' Le fallback local n\'est pas disponible.'
    
    throw new Error(
      `Impossible de générer le PDF. ` +
      `Service réseau (${PDF_SERVICE_PROVIDER}) sur ${serviceUrl} inaccessible.${fallbackInfo} ` +
      `Erreur: ${errorMessage}`
    )
  }
}

export function generateTransactionPDFHTML(data: {
  transactionId: string
  safeName: string
  userName: string
  type: string
  mode: string
  amount: number
  billDetails: Record<string, number>
  date: string
  notes?: string
}): string {
  const billDetailsHtml = Object.entries(data.billDetails)
    .filter(([_, qty]) => qty > 0)
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .map(([value, quantity]) => {
      const total = parseFloat(value) * quantity
      return `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; font-weight: 600;">${value}€</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">${quantity}</td>
          <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151; font-weight: 500;">${total.toFixed(2)}€</td>
        </tr>
      `
    })
    .join('')

  const typeLabel = data.type === 'INVENTORY' ? 'Inventaire' : 'Mouvement'
  const modeLabel = data.mode === 'ADD' ? 'Ajout' : data.mode === 'REMOVE' ? 'Retrait' : 'Remplacement'
  const modeColor = data.mode === 'ADD' ? '#10b981' : data.mode === 'REMOVE' ? '#ef4444' : '#3b82f6'

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Transaction ${data.transactionId}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #ffffff;
            color: #111827;
            padding: 0;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 30mm 25mm;
            background: #ffffff;
          }
          
          .header {
            border-bottom: 3px solid #1f2937;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.5px;
          }
          
          .document-info {
            text-align: right;
            font-size: 12px;
            color: #6b7280;
          }
          
          .document-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 10px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          
          .info-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
          }
          
          .badge {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .badge-type {
            background: #dbeafe;
            color: #1e40af;
            border: 1px solid #93c5fd;
          }
          
          .badge-mode {
            background: ${modeColor === '#10b981' ? '#d1fae5' : modeColor === '#ef4444' ? '#fee2e2' : '#dbeafe'};
            color: ${modeColor === '#10b981' ? '#065f46' : modeColor === '#ef4444' ? '#991b1b' : '#1e40af'};
            border: 1px solid ${modeColor === '#10b981' ? '#6ee7b7' : modeColor === '#ef4444' ? '#fca5a5' : '#93c5fd'};
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          thead {
            background: #f9fafb;
          }
          
          th {
            padding: 14px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          th:nth-child(2) {
            text-align: center;
          }
          
          th:nth-child(3) {
            text-align: right;
          }
          
          tbody tr:last-child td {
            border-bottom: none;
          }
          
          .total-section {
            margin-top: 30px;
            padding: 25px;
            background: #f9fafb;
            border: 2px solid #1f2937;
            border-radius: 8px;
            text-align: right;
          }
          
          .total-label {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 8px;
          }
          
          .total-amount {
            font-size: 36px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -1px;
          }
          
          .notes {
            margin-top: 30px;
            padding: 20px;
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
          }
          
          .notes-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .notes-content {
            font-size: 14px;
            color: #374151;
            line-height: 1.6;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-top">
              <div class="logo">SafeGuard</div>
              <div class="document-info">
                <div>Document généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div style="margin-top: 4px;">SafeGuard v1.0</div>
              </div>
            </div>
            <div class="document-title">Relevé de transaction</div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Coffre</div>
              <div class="info-value">${data.safeName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Utilisateur</div>
              <div class="info-value">${data.userName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Type</div>
              <div class="info-value">
                <span class="badge badge-type">${typeLabel}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Mode</div>
              <div class="info-value">
                <span class="badge badge-mode">${modeLabel}</span>
              </div>
            </div>
            <div class="info-item">
              <div class="info-label">Date</div>
              <div class="info-value">${data.date}</div>
            </div>
            <div class="info-item">
              <div class="info-label">ID Transaction</div>
              <div class="info-value" style="font-size: 12px; color: #6b7280;">${data.transactionId}</div>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Valeur</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${billDetailsHtml}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-label">Montant total</div>
            <div class="total-amount">${data.amount.toFixed(2)}€</div>
          </div>
          
          ${data.notes ? `
            <div class="notes">
              <div class="notes-label">Notes</div>
              <div class="notes-content">${data.notes}</div>
            </div>
          ` : ''}
          
          <div class="footer">
            Ce document a été généré automatiquement par SafeGuard. Il représente l'état de la transaction au moment de sa génération.
          </div>
        </div>
      </body>
    </html>
  `
}

export function generateInventoryPDFHTML(data: {
  safeName: string
  safeDescription?: string
  userName: string
  date: string
  billDetails: Record<string, number>
  totalAmount: number
}): string {
  const BILL_VALUES = [500, 200, 100, 50, 20, 10, 5]
  
  // Tableau professionnel des billets
  const billsTableRows = BILL_VALUES.map(value => {
    const quantity = data.billDetails[value.toString()] || 0
    const total = value * quantity
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; color: #374151; font-weight: 600;">${value}€</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center; font-size: 14px; color: #6b7280;">${quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-size: 14px; color: #374151; font-weight: 500;">${total.toFixed(2)}€</td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Inventaire ${data.safeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #ffffff;
            color: #111827;
            padding: 0;
            font-size: 14px;
            line-height: 1.6;
          }
          
          .container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 30mm 25mm;
            background: #ffffff;
          }
          
          .header {
            border-bottom: 3px solid #1f2937;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          
          .header-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 15px;
          }
          
          .logo {
            font-size: 28px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -0.5px;
          }
          
          .document-info {
            text-align: right;
            font-size: 12px;
            color: #6b7280;
          }
          
          .document-title {
            font-size: 24px;
            font-weight: 700;
            color: #111827;
            margin-top: 10px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
            gap: 5px;
          }
          
          .info-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .info-value {
            font-size: 15px;
            font-weight: 600;
            color: #111827;
          }
          
          .description-box {
            margin: 20px 0;
            padding: 15px;
            background: #f9fafb;
            border-left: 4px solid #3b82f6;
            border-radius: 4px;
          }
          
          .description-label {
            font-size: 11px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
          }
          
          .description-content {
            font-size: 14px;
            color: #374151;
            line-height: 1.6;
          }
          
          .bills-table {
            width: 100%;
            border-collapse: collapse;
            margin: 30px 0;
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .bills-table thead {
            background: #f9fafb;
          }
          
          .bills-table th {
            padding: 14px 12px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 2px solid #e5e7eb;
          }
          
          .bills-table th:nth-child(2) {
            text-align: center;
          }
          
          .bills-table th:nth-child(3) {
            text-align: right;
          }
          
          .bills-table tbody tr:last-child td {
            border-bottom: none;
          }
          
          .total-section {
            margin-top: 30px;
            padding: 25px;
            background: #f9fafb;
            border: 2px solid #1f2937;
            border-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          
          .total-label {
            font-size: 14px;
            font-weight: 600;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .total-amount {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          
          .total-currency {
            font-size: 20px;
            color: #9ca3af;
            font-weight: 500;
          }
          
          .total-value {
            font-size: 36px;
            font-weight: 700;
            color: #111827;
            letter-spacing: -1px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #9ca3af;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-top">
              <div class="logo">SafeGuard</div>
              <div class="document-info">
                <div>Document généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                <div style="margin-top: 4px;">SafeGuard v1.0</div>
              </div>
            </div>
            <div class="document-title">Inventaire du coffre</div>
          </div>
          
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Coffre</div>
              <div class="info-value">${data.safeName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Généré par</div>
              <div class="info-value">${data.userName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date de l'inventaire</div>
              <div class="info-value">${data.date}</div>
            </div>
          </div>
          
          ${data.safeDescription ? `
            <div class="description-box">
              <div class="description-label">Description</div>
              <div class="description-content">${data.safeDescription}</div>
            </div>
          ` : ''}
          
          <table class="bills-table">
            <thead>
              <tr>
                <th>Valeur</th>
                <th>Quantité</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${billsTableRows}
            </tbody>
          </table>
          
          <div class="total-section">
            <div class="total-label">Total en caisse</div>
            <div class="total-amount">
              <span class="total-currency">€</span>
              <span class="total-value">${data.totalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            Ce document a été généré automatiquement par SafeGuard. Il représente l'état de l'inventaire au moment de sa génération.
          </div>
        </div>
      </body>
    </html>
  `
}
