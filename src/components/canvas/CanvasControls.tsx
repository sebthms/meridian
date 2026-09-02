import { Controls, ControlButton, useReactFlow, useStore, useStoreApi } from '@xyflow/react'
import { Lock, Maximize, Minus, Plus, Unlock } from 'lucide-react'
import { AppTooltip } from '@/components/ui/tooltip'

/** React Flow actions, using the same accessible tooltips as the rest of the app. */
export function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow()
  const store = useStoreApi()
  const zoomInDisabled = useStore((state) => state.transform[2] >= state.maxZoom)
  const zoomOutDisabled = useStore((state) => state.transform[2] <= state.minZoom)
  const interactive = useStore((state) => state.nodesDraggable || state.nodesConnectable || state.elementsSelectable)
  const toggleInteractive = () => store.setState({ nodesDraggable: !interactive, nodesConnectable: !interactive, elementsSelectable: !interactive })
  const lockLabel = interactive ? 'Verrouiller le diagramme' : 'Déverrouiller le diagramme'
  return (
    <Controls showZoom={false} showFitView={false} showInteractive={false} aria-label="Navigation du diagramme"
      className="!m-4 !overflow-hidden !rounded-xl !border-border/60 !bg-card/90 !shadow-lg [&_button]:!border-border/60 [&_button]:!bg-card [&_button]:!text-muted-foreground [&_button:hover]:!bg-accent [&_button:hover]:!text-foreground">
      <AppTooltip content="Zoom avant" side="right"><ControlButton aria-label="Zoom avant" disabled={zoomInDisabled} onClick={() => void zoomIn()}><Plus /></ControlButton></AppTooltip>
      <AppTooltip content="Zoom arrière" side="right"><ControlButton aria-label="Zoom arrière" disabled={zoomOutDisabled} onClick={() => void zoomOut()}><Minus /></ControlButton></AppTooltip>
      <AppTooltip content="Cadrer le diagramme" side="right"><ControlButton aria-label="Cadrer le diagramme" onClick={() => void fitView()}><Maximize /></ControlButton></AppTooltip>
      <AppTooltip content={lockLabel} side="right"><ControlButton aria-label={lockLabel} aria-pressed={!interactive} onClick={toggleInteractive}>{interactive ? <Unlock /> : <Lock />}</ControlButton></AppTooltip>
    </Controls>
  )
}
