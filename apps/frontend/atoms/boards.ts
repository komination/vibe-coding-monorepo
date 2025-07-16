import { atom } from 'jotai'
import { Board } from '@kanban/domain-core'
import { currentUserAtom } from './auth'

export const selectedBoardAtom = atom<Board | null>(null)

export const canEditSelectedBoardAtom = atom((get) => {
  const board = get(selectedBoardAtom)
  const currentUser = get(currentUserAtom)
  if (!board || !currentUser) return false
  return board.ownerId === currentUser.id
})