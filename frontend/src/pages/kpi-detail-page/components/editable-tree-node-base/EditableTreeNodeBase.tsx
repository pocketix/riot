import React, { ReactNode, useMemo } from 'react'
import { editableTreeConfiguration } from '../editable-tree/EditableTree'
import styles from './EditableNodeTreeBase.module.scss'

interface EditableTreeNodeBaseProps {
  treeNodeContents: ReactNode
  onClickHandler?: () => void
}

const EditableTreeNodeBase: React.FC<EditableTreeNodeBaseProps> = (props) => {
  const styleObject = useMemo(() => {
    const padding: number = 10
    return {
      padding: padding,
      width: editableTreeConfiguration.sizeConfiguration.foreignObjectWidthInPixels - 2 * padding,
      height: editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels - 2 * padding
    }
  }, [])
  return (
    <div className={styles.editableTreeNodeBase} style={styleObject} onClick={props.onClickHandler}>
      {props.treeNodeContents}
    </div>
  )
}

export default EditableTreeNodeBase
