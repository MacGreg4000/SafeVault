export const TransactionType = {
  INVENTORY: 'INVENTORY',
  MOVEMENT: 'MOVEMENT',
} as const

export const TransactionMode = {
  ADD: 'ADD',
  REMOVE: 'REMOVE',
  REPLACE: 'REPLACE',
} as const

export type TransactionType = typeof TransactionType[keyof typeof TransactionType]
export type TransactionMode = typeof TransactionMode[keyof typeof TransactionMode]



