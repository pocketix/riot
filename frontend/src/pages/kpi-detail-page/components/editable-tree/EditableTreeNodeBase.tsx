import React, { ReactNode, useMemo } from 'react'
import { editableTreeConfiguration } from './EditableTree'
import { EffectFunction } from '../../../../util'

interface EditableTreeNodeBaseProps {
  treeNodeContents: ReactNode
  onClick?: EffectFunction
}

const EditableTreeNodeBase: React.FC<EditableTreeNodeBaseProps> = (props) => {
  const styleObject = useMemo(() => {
    return {
      padding: 10,
      borderWidth: 2,
      width: editableTreeConfiguration.sizeConfiguration.foreignObjectWidthInPixels,
      height: editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels
    }
  }, [])
  return (
    <div className="flex items-center justify-center rounded-[20px] border-[#5d5d5d] bg-gray-100" style={styleObject} onClick={props.onClick}>
      {props.treeNodeContents}
    </div>
  )
}

export default EditableTreeNodeBase
