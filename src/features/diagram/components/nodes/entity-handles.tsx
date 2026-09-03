import { Handle, Position } from '@xyflow/react'
import { sourceHandleClass, targetHandleClass } from './node-handles'

export function EntityHandles() {
  return (
    <>
      <Handle type="source" id="source" position={Position.Top} aria-label="Relier à une association" className={sourceHandleClass} />
      <Handle type="target" id="target" position={Position.Left} aria-label="Point de réception" className={targetHandleClass} />
      <Handle type="source" id="right" position={Position.Right} aria-label="Point de départ réflexif" className={sourceHandleClass} />
      <Handle type="target" id="bottom" position={Position.Bottom} aria-label="Point de réception réflexif" className={targetHandleClass} />
      <Handle type="source" id="reflexive-source" position={Position.Bottom} style={{ left: '30%' }} aria-label="Point de départ réflexif" className={sourceHandleClass} />
      <Handle type="target" id="reflexive-target-0" position={Position.Bottom} style={{ left: '42%' }} aria-label="Premier point de réception réflexif" className={targetHandleClass} />
      <Handle type="target" id="reflexive-target-1" position={Position.Bottom} style={{ left: '70%' }} aria-label="Second point de réception réflexif" className={targetHandleClass} />
    </>
  )
}
