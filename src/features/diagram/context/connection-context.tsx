import { createContext, useContext, type ReactNode } from 'react'

export type ConnectionState = {
  isConnecting: boolean
  sourceNodeId: string | null
}

const defaultState: ConnectionState = { isConnecting: false, sourceNodeId: null }

const ConnectionContext = createContext<ConnectionState>(defaultState)

export function ConnectionProvider({
  value,
  children,
}: {
  value: ConnectionState
  children: ReactNode
}) {
  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>
}

export function useConnectionState() {
  return useContext(ConnectionContext)
}
