import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/app/actions/auth'
import { prisma } from '@/lib/prisma'
import { generatePDF, generateInventoryPDFHTML } from '@/lib/pdf-service'
import { format } from 'date-fns'

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { safeId } = await request.json()

    if (!safeId) {
      return NextResponse.json(
        { error: 'ID de coffre requis' },
        { status: 400 }
      )
    }

    const safe = await prisma.safe.findUnique({
      where: { id: safeId },
      include: {
        inventories: true,
      },
    })

    if (!safe) {
      return NextResponse.json(
        { error: 'Coffre non trouvé' },
        { status: 404 }
      )
    }

    // Vérifier les permissions
    if (user.role !== 'ADMIN') {
      const permission = await prisma.userSafePermission.findUnique({
        where: {
          userId_safeId: {
            userId: user.id,
            safeId: safe.id,
          },
        },
      })

      if (!permission || !permission.canRead) {
        return NextResponse.json(
          { error: 'Accès refusé' },
          { status: 403 }
        )
      }
    }

    const inventory = safe.inventories?.[0]
    if (!inventory) {
      return NextResponse.json(
        { error: 'Inventaire non trouvé' },
        { status: 404 }
      )
    }

    const billDetails = typeof inventory.billDetails === 'string'
      ? JSON.parse(inventory.billDetails)
      : inventory.billDetails

    const html = generateInventoryPDFHTML({
      safeName: safe.name,
      safeDescription: safe.description || undefined,
      userName: user.name,
      date: format(new Date(inventory.updatedAt), 'dd/MM/yyyy HH:mm'),
      billDetails: billDetails as Record<string, number>,
      totalAmount: inventory.totalAmount,
    })

    const pdf = await generatePDF(html)

    return new NextResponse(pdf as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inventaire-${safe.name}-${format(new Date(), 'yyyy-MM-dd')}.pdf"`,
      },
    })
  } catch (error: any) {
    console.error('Erreur export PDF inventaire:', error)
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la génération du PDF' },
      { status: 500 }
    )
  }
}

