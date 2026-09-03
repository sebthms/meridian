import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './index.css'
import { initTheme } from '@/shared/theme/theme'
import { initI18n } from '@/i18n/index'
import App from './app/app'
import { TooltipProvider } from '@/shared/ui/tooltip'

initTheme()
initI18n()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </StrictMode>,
)
