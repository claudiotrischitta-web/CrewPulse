import { createContext, type Dispatch } from 'react'
import type { Action, State } from './store'

/** Kept in its own module so the context object survives hot reloads of store.tsx during development. */
export const StoreContext = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null)
