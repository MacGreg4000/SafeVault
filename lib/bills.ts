// Valeurs des billets Euro en centimes
export const BILL_VALUES = [5, 10, 20, 50, 100, 200, 500] as const

export type BillValue = typeof BILL_VALUES[number]

export interface BillDetails {
  [key: string]: number // "5": 10 signifie 10 billets de 5€
}

export function calculateTotal(billDetails: BillDetails): number {
  return Object.entries(billDetails).reduce((total, [value, quantity]) => {
    return total + parseFloat(value) * quantity
  }, 0)
}

export function validateBillDetails(billDetails: BillDetails): boolean {
  return Object.keys(billDetails).every((key) => {
    const value = parseFloat(key)
    return BILL_VALUES.includes(value as BillValue) && billDetails[key] >= 0
  })
}

export function formatBillDetails(billDetails: BillDetails): string {
  return Object.entries(billDetails)
    .filter(([_, quantity]) => quantity > 0)
    .sort(([a], [b]) => parseFloat(b) - parseFloat(a))
    .map(([value, quantity]) => `${quantity}x ${value}€`)
    .join(', ')
}



