import React, { useMemo } from 'react'
import { AtomNodeType } from './EditableTree'
import EditableTreeNodeBase from './EditableTreeNodeBase'
import { EffectFunction } from '../util'

interface AtomNodeProps {
  type: AtomNodeType
  sdParameterSpecification: string
  referenceValue: string | boolean | number
  onClickHandler: EffectFunction
}

const AtomNode: React.FC<AtomNodeProps> = (props) => {
  const { type, sdParameterSpecification, referenceValue } = props

  const binaryRelationSymbol: string = useMemo(() => {
    switch (type) {
      case AtomNodeType.StringEQ:
      case AtomNodeType.BooleanEQ:
      case AtomNodeType.NumericEQ:
        return '='
      case AtomNodeType.NumericLT:
        return '<'
      case AtomNodeType.NumericLEQ:
        return '≤'
      case AtomNodeType.NumericGT:
        return '>'
      case AtomNodeType.NumericGEQ:
        return '≥'
    }
  }, [type])

  const referenceValueString: string = useMemo(() => {
    switch (typeof referenceValue) {
      case 'string':
        return `"${referenceValue}"`
      case 'boolean':
        return referenceValue ? 'true' : 'false'
      case 'number':
        return referenceValue.toString()
    }
  }, [referenceValue])

  return (
    <EditableTreeNodeBase treeNodeContents={<p className="truncate font-math">{`${sdParameterSpecification} ${binaryRelationSymbol} ${referenceValueString}`}</p>} onClick={props.onClickHandler} />
  )
}

export default AtomNode
