import React from 'react'
import styles from './styles.module.scss'
import { EffectFunction } from '../../util'

interface CustomActionButtonProps {
  action: EffectFunction
  text: string
  iconIdentifier: string
}

export const CustomActionButton: React.FC<CustomActionButtonProps> = (props) => {
  return (
    <div className={styles.customActionButton} onClick={props.action}>
      <span className="material-symbols-outlined">{props.iconIdentifier}</span>
      <span>{props.text}</span>
    </div>
  )
}

export default CustomActionButton
