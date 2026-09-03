import { Handle, Position } from '@xyflow/react'
import { sourceHandleClass, targetHandleClass } from './node-handles'

export function AssociationHandles() {
  return (
    <>
      <Handle type="target" id="left" position={Position.Left} aria-label="Point de réception" className={targetHandleClass} />
      <Handle type="source" id="right" position={Position.Right} aria-label="Point de départ" className={sourceHandleClass} />
      <Handle type="target" id="reflexive-target-0" position={Position.Top} style={{ left: '30%' }} aria-label="Point de réception réflexif" className={targetHandleClass} />
      <Handle type="source" id="reflexive-source-0" position={Position.Top} style={{ left: '42%' }} aria-label="Premier point de départ réflexif" className={sourceHandleClass} />
      <Handle type="source" id="reflexive-source-1" position={Position.Top} style={{ left: '70%' }} aria-label="Second point de départ réflexif" className={sourceHandleClass} />
    </>
  )
}
