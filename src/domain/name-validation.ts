export const MODEL_NAME_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/

export function isValidModelName(value: string): boolean {
  return MODEL_NAME_PATTERN.test(value)
}

export function modelNameError(label = 'Le nom'): string {
  return `${label} doit commencer par une lettre ou _, puis contenir uniquement des lettres sans accent, chiffres et _.`
}
