import { atom } from 'jotai'
import { Board, BoardMember } from '@kanban/domain-core'
import { currentUserAtom } from './auth'

export const boardsAtom = atom<Board[]>([])
export const selectedBoardAtom = atom<Board | null>(null)
export const boardMembersAtom = atom<BoardMember[]>([])

export const selectedBoardIdAtom = atom((get) => get(selectedBoardAtom)?.id)
export const boardCountAtom = atom((get) => get(boardsAtom).length)

export const canEditSelectedBoardAtom = atom((get) => {
  const board = get(selectedBoardAtom)
  const currentUser = get(currentUserAtom)
  if (!board || !currentUser) return false
  return board.ownerId === currentUser.id
})