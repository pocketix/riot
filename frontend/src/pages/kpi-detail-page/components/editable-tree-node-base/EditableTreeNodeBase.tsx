import React, { ReactNode, useMemo } from 'react'
import { editableTreeConfiguration } from '../editable-tree/EditableTree'
import styles from './styles.module.scss'
import { EffectFunction } from '../../../../util'

interface EditableTreeNodeBaseProps {
  treeNodeContents: ReactNode
  onClickHandler?: EffectFunction
}

const EditableTreeNodeBase: React.FC<EditableTreeNodeBaseProps> = (props) => {
  const styleObject = useMemo(() => {
    const padding: number = 10
    const borderWidth: number = 2
    return {
      padding: padding,
      borderWidth: borderWidth,
      width: editableTreeConfiguration.sizeConfiguration.foreignObjectWidthInPixels - 2 * padding - 2 * borderWidth,
      height: editableTreeConfiguration.sizeConfiguration.foreignObjectHeightInPixels - 2 * padding - 2 * borderWidth
    }
  }, [])
  return (
    <div className={styles.editableTreeNodeBase} style={styleObject} onClick={props.onClickHandler}>
      {props.treeNodeContents}
    </div>
  )
}

export default EditableTreeNodeBase
