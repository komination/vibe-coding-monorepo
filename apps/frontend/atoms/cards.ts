import { atom } from 'jotai'
import { Card } from '@kanban/domain-core'

export const cardsAtom = atom<Record<string, Card[]>>({})
export const selectedCardAtom = atom<Card | null>(null)

export const cardsByListAtom = (listId: string) =>
  atom((get) => {
    const cards = get(cardsAtom)
    return (cards[listId] || []).sort((a, b) => a.position - b.position)
  })

export const overduedCardsAtom = atom((get) => {
  const allCards = Object.values(get(cardsAtom)).flat()
  const now = new Date()
  return allCards.filter(card => card.dueDate && new Date(card.dueDate) < now)
})

export const cardsByAssigneeAtom = (assigneeId: string) =>
  atom((get) => {
    const allCards = Object.values(get(cardsAtom)).flat()
    return allCards.filter(card => card.assigneeId === assigneeId)
  })