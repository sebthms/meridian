import type { Attribute, DateTimeKind, NumericKind, OtherKind, TextCharset, TextStorage } from '../../../domain/attribute'

export type TypeSection = 'text' | 'numeric' | 'dateTime' | 'other'

export function propertyTypeDefaults(attribute?: Attribute) {
  const config = attribute?.typeConfig
  const section: TypeSection = config?.text ? 'text'
    : config?.numeric ? 'numeric' : config?.dateTime ? 'dateTime' : config?.other ? 'other'
      : attribute?.conceptualType === 'INTEGER' || attribute?.conceptualType === 'DECIMAL' ? 'numeric'
        : attribute?.conceptualType === 'DATE' ? 'dateTime' : attribute?.conceptualType === 'BOOLEAN' ? 'other' : 'text'
  return {
    section,
    textCharset: config?.text?.charset ?? 'ASCII' as TextCharset,
    textStorage: config?.text?.storage ?? (attribute?.conceptualType === 'TEXT' ? 'LARGE' : 'VARIABLE') as TextStorage,
    textLength: config?.text?.length ?? 50,
    collation: config?.text?.collation ?? '',
    numericKind: config?.numeric?.kind ?? (attribute?.conceptualType === 'DECIMAL' ? 'DECIMAL' : 'INTEGER') as NumericKind,
    numericBits: config?.numeric?.bits ?? 32,
    precision: config?.numeric?.precision ?? 15,
    scale: config?.numeric?.scale ?? 2,
    floating: config?.numeric?.floating ?? 'DOUBLE' as const,
    dateTimeKind: config?.dateTime?.kind ?? (attribute?.conceptualType === 'DATE' ? 'DATE' : 'DATETIME') as DateTimeKind,
    timezone: config?.dateTime?.timezone === true,
    otherKind: config?.other?.kind ?? 'BOOLEAN' as OtherKind,
    freeType: config?.other?.freeType ?? '',
  }
}
