import { type ReactNode } from 'react'

import {
  BaseNode,
  BaseNodeContent,
  BaseNodeHeader,
} from '@/features/diagram/components/flow/base-node'
import { TableBody, TableRow, TableCell } from '@/shared/ui/table'

export type DatabaseSchemaNodeHeaderProps = {
  children?: ReactNode
  className?: string
}

export const DatabaseSchemaNodeHeader = ({
  children,
  className,
}: DatabaseSchemaNodeHeaderProps) => {
  return (
    <BaseNodeHeader className={`bg-node-header text-muted-foreground rounded-tl-md rounded-tr-md p-1 text-center text-sm ${className || ''}`}>
      {children}
    </BaseNodeHeader>
  )
}

export type DatabaseSchemaNodeBodyProps = {
  children?: ReactNode
}

export const DatabaseSchemaNodeBody = ({ children }: DatabaseSchemaNodeBodyProps) => {
  return (
    <BaseNodeContent className="p-0">
      <table className="border-spacing-10 overflow-visible">
        <TableBody>{children}</TableBody>
      </table>
    </BaseNodeContent>
  )
}

export type DatabaseSchemaTableRowProps = {
  children: ReactNode
  className?: string
}

export const DatabaseSchemaTableRow = ({
  children,
  className,
}: DatabaseSchemaTableRowProps) => {
  return (
    <TableRow className={`relative text-xs ${className || ''}`}>
      {children}
    </TableRow>
  )
}

export type DatabaseSchemaTableCellProps = {
  className?: string
  children?: ReactNode
}

export const DatabaseSchemaTableCell = ({
  className,
  children,
}: DatabaseSchemaTableCellProps) => {
  return <TableCell className={className}>{children}</TableCell>
}

export type DatabaseSchemaNodeProps = {
  className?: string
  children?: ReactNode
}

export const DatabaseSchemaNode = ({
  className,
  children,
}: DatabaseSchemaNodeProps) => {
  return <BaseNode className={className}>{children}</BaseNode>
}
