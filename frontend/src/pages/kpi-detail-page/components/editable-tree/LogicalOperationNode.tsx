import React, { useMemo } from 'react'
import { LogicalOperationNodeType } from './EditableTree'
import EditableTreeNodeBase from './EditableTreeNodeBase'
import { EffectFunction } from '../../../../util'

interface LogicalOperationNodeProps {
  type: LogicalOperationNodeType
  onClick: EffectFunction
}

const LogicalOperationNode: React.FC<LogicalOperationNodeProps> = (props) => {
  const logicalOperationDenotation: string = useMemo(() => {
    switch (props.type) {
      case LogicalOperationNodeType.AND:
        return 'AND'
      case LogicalOperationNodeType.OR:
        return 'OR'
      case LogicalOperationNodeType.NOR:
        return 'NOR'
    }
  }, [props.type])

  return <EditableTreeNodeBase treeNodeContents={<p className="font-math text-[40px]">{logicalOperationDenotation}</p>} onClick={props.onClick} />
}

export default LogicalOperationNode
