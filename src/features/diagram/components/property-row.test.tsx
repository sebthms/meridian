import { renderToStaticMarkup } from 'react-dom/server'
import { expect, it } from 'vitest'
import { TooltipProvider } from '@/shared/ui/tooltip'
import { PropertyRow } from './property-row'

it('n’imbrique plus de boutons dans une ligne de propriété', () => {
  const html = renderToStaticMarkup(
    <TooltipProvider>
      <PropertyRow name="code" type="TEXT" unique onEdit={() => {}} onDelete={() => {}} />
    </TooltipProvider>,
  )
  expect(html.match(/<button\b/g)).toHaveLength(4)
  expect(html).not.toMatch(/<button\b[^>]*>\s*<button\b/)
})
