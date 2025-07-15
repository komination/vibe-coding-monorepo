import { atom } from 'jotai'
import { atomWithStorage } from 'jotai/utils'

export type Theme = 'light' | 'dark'
export type View = 'board' | 'timeline' | 'calendar'

export const themeAtom = atomWithStorage<Theme>('kanban-theme', 'light')
export const sidebarOpenAtom = atom(true)
export const selectedViewAtom = atom<View>('board')

export const draggedItemAtom = atom<{
  type: 'card' | 'list'
  id: string
  sourceListId?: string
} | null>(null)

export const dragOverListIdAtom = atom<string | null>(null)

export const modalStateAtom = atom<{
  type: 'create-board' | 'edit-board' | 'create-list' | 'edit-card' | null
  data?: any
}>({
  type: null,
})

export const recentBoardsAtom = atomWithStorage<string[]>('kanban-recent-boards', [])