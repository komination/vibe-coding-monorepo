import { atom } from 'jotai'
import { List } from '@kanban/domain-core'

export const listsAtom = atom<List[]>([])
export const selectedListAtom = atom<List | null>(null)

export const sortedListsAtom = atom((get) => {
  const lists = get(listsAtom)
  return [...lists].sort((a, b) => a.position - b.position)
})

export const listsByBoardAtom = (boardId: string) => 
  atom((get) => {
    const lists = get(listsAtom)
    return lists.filter(list => list.boardId === boardId)
  })