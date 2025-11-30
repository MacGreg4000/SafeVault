import puppeteer from 'puppeteer-core'

const BROWSER_URL = process.env.PUPPETEER_BROWSER_URL || 'http://localhost:3001'

export interface PDFOptions {
  format?: 'A4' | 'Letter'
  margin?: {
    top?: string
    right?: string
    bottom?: string
    left?: string
  }
}

export async function generatePDF(html: string, options: PDFOptions = {}) {
  let browser
  try {
    // Connexion au service Puppeteer externe
    browser = await puppeteer.connect({
      browserURL: BROWSER_URL,
    })

    const page = await browser.newPage()
    
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    })

    const pdf = await page.pdf({
      format: options.format || 'A4',
      margin: options.margin || {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm',
      },
      printBackground: true,
    })

    await page.close()
    return pdf
  } catch (error) {
    console.error('Erreur lors de la génération PDF:', error)
    throw new Error('Impossible de générer le PDF. Vérifiez que le service Puppeteer est accessible sur le port 3001.')
  } finally {
    // Ne pas fermer le browser car il est partagé
    // await browser?.close()
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
          <td style="padding: 8px; border: 1px solid #ddd;">${value}€</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${quantity}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${total.toFixed(2)}€</td>
        </tr>
      `
    })
    .join('')

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Transaction ${data.transactionId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
          }
          h1 {
            color: #333;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
          }
          .info {
            margin: 20px 0;
          }
          .info-row {
            margin: 5px 0;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th {
            background-color: #f0f0f0;
            padding: 10px;
            text-align: left;
            border: 1px solid #ddd;
          }
          .total {
            font-size: 1.2em;
            font-weight: bold;
            margin-top: 20px;
            text-align: right;
          }
        </style>
      </head>
      <body>
        <h1>Transaction SafeGuard</h1>
        <div class="info">
          <div class="info-row"><strong>ID:</strong> ${data.transactionId}</div>
          <div class="info-row"><strong>Coffre:</strong> ${data.safeName}</div>
          <div class="info-row"><strong>Utilisateur:</strong> ${data.userName}</div>
          <div class="info-row"><strong>Type:</strong> ${data.type}</div>
          <div class="info-row"><strong>Mode:</strong> ${data.mode}</div>
          <div class="info-row"><strong>Date:</strong> ${data.date}</div>
          ${data.notes ? `<div class="info-row"><strong>Notes:</strong> ${data.notes}</div>` : ''}
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
        <div class="total">Total: ${data.amount.toFixed(2)}€</div>
      </body>
    </html>
  `
}

