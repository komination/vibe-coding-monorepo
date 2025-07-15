import { atom } from 'jotai'
import { User } from '@kanban/domain-core'

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export const authAtom = atom<AuthState>({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
})

export const currentUserAtom = atom((get) => get(authAtom).user)
export const isAuthenticatedAtom = atom((get) => get(authAtom).isAuthenticated)
export const isLoadingAuthAtom = atom((get) => get(authAtom).isLoading)