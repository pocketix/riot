import React from 'react'
import { LogicalOperationNodeType } from './EditableTree'
import EditableTreeNodeBase from './EditableTreeNodeBase'
import { EffectFunction } from '../util'

interface LogicalOperationNodeProps {
  type: LogicalOperationNodeType
  onClick: EffectFunction
}

const LogicalOperationNode: React.FC<LogicalOperationNodeProps> = (props) => <EditableTreeNodeBase treeNodeContents={<p className="font-math text-[40px]">{props.type}</p>} onClick={props.onClick} />

export default LogicalOperationNode
