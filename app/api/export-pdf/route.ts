import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { generatePDF, generateTransactionPDFHTML } from '@/lib/pdf-service'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json(
        { error: 'ID de transaction requis' },
        { status: 400 }
      )
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        user: {
          select: { name: true },
        },
        safe: {
          select: { name: true },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction non trouvée' },
        { status: 404 }
      )
    }

    const billDetails = typeof transaction.billDetails === 'string'
      ? JSON.parse(transaction.billDetails)
      : transaction.billDetails

    const html = generateTransactionPDFHTML({
      transactionId: transaction.id,
      safeName: transaction.safe.name,
      userName: transaction.user.name,
      type: transaction.type,
      mode: transaction.mode,
      amount: transaction.amount,
      billDetails: billDetails as Record<string, number>,
      date: format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm'),
      notes: transaction.notes || undefined,
    })

    const pdf = await generatePDF(html)

    return new NextResponse(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="transaction-${transactionId}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Erreur export PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

