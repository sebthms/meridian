import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { AppTooltip, TooltipProvider } from './tooltip'
import { PropertyRow } from '@/components/canvas/PropertyRow'

describe('Tooltips partagés', () => {
  it('garde un seul bouton et son nom accessible', () => {
    const html = renderToStaticMarkup(createElement(TooltipProvider, {
      children: createElement(AppTooltip, { content: 'Modifier', children: createElement('button', { 'aria-label': 'Modifier' }, 'Action') }),
    }))
    expect(html.match(/<button\b/g)).toHaveLength(1)
    expect(html).toContain('aria-label="Modifier"')
    expect(html).not.toContain('title=')
  })

  it('permet de focaliser l’explication d’un bouton désactivé', () => {
    const html = renderToStaticMarkup(createElement(TooltipProvider, {
      children: createElement(AppTooltip, { content: 'Indisponible', children: createElement('button', { disabled: true }, 'Action') }),
    }))
    expect(html).toContain('tabindex="0"')
    expect(html).toContain('disabled=""')
    expect(html.match(/<button\b/g)).toHaveLength(1)
  })

  it('n’imbrique plus de boutons dans une ligne de propriété', () => {
    const html = renderToStaticMarkup(createElement(TooltipProvider, {
      children: createElement(PropertyRow, { name: 'code', type: 'TEXT', unique: true, onEdit: () => {}, onDelete: () => {} }),
    }))
    expect(html.match(/<button\b/g)).toHaveLength(4)
    expect(html).not.toMatch(/<button\b[^>]*>\s*<button\b/)
  })
})
