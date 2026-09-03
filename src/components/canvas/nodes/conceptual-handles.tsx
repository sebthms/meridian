import { Handle, Position } from '@xyflow/react'
import { sourceHandleClass, targetHandleClass } from './node-handles'

export function ConceptualHandles() {
  return (
    <>
      <Handle type="source" id="source" position={Position.Top} className={sourceHandleClass} />
      <Handle type="target" id="target" position={Position.Top} className={targetHandleClass} />
      <Handle type="source" id="right" position={Position.Right} className={sourceHandleClass} />
      <Handle type="target" id="left" position={Position.Left} className={targetHandleClass} />
      <Handle type="source" id="bottom-source" position={Position.Bottom} className={sourceHandleClass} />
      <Handle type="target" id="bottom" position={Position.Bottom} className={targetHandleClass} />
    </>
  )
}
