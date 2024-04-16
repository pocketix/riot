import React, { useMemo } from 'react'
import { AtomNodeType } from '../editable-tree/EditableTree'
import EditableTreeNodeBase from '../editable-tree-node-base/EditableTreeNodeBase'

interface AtomNodeProps {
  type: AtomNodeType
  sdParameterSpecification: string
  referenceValue: string | boolean | number
}

const AtomNode: React.FC<AtomNodeProps> = (props) => {
  const binaryRelationSymbol: string = useMemo(() => {
    switch (props.type) {
      case AtomNodeType.StringEQ:
      case AtomNodeType.BooleanEQ:
      case AtomNodeType.NumericEQ:
        return '=='
      case AtomNodeType.NumericLT:
        return '<'
      case AtomNodeType.NumericLEQ:
        return '≤'
      case AtomNodeType.NumericGT:
        return '>'
      case AtomNodeType.NumericGEQ:
        return '≥'
    }
  }, [props.type])

  return <EditableTreeNodeBase treeNodeContents={<p>{`${props.sdParameterSpecification} ${binaryRelationSymbol} ${props.referenceValue}`}</p>} />
}

export default AtomNode
