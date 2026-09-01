import { useState, useRef, useEffect } from 'react'
import { isValidModelName } from '@/domain'

/**
 * Édition inline du nom d'un élément (entité ou association) :
 * double-clic sur le libellé → champ texte + ✓/✕ (icônes).
 * `onCommit` reçoit le nom nettoyé ; il est responsable de l'application.
 */
export function useRename(label: string, onCommit: (name: string) => void) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(label)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editing])

  const start = () => {
    setDraft(label)
    setEditing(true)
  }
  const commit = () => {
    if (isValidModelName(draft.trim())) onCommit(draft.trim())
    setEditing(false)
  }
  const cancel = () => setEditing(false)

  return { editing, draft, setDraft, inputRef, start, commit, cancel }
}
