import React from 'react'
import styles from './CustomActionButton.module.scss'

interface CustomActionButtonProps {
  action: VoidFunction
  text: string
  iconIdentifier: string
}

export const CustomActionButton: React.FC<CustomActionButtonProps> = ({ action, text, iconIdentifier }) => {
  return (
    <div className={styles.customAction} onClick={action}>
      <span className="material-symbols-outlined">{iconIdentifier}</span>
      <span>{text}</span>
    </div>
  )
}

export default CustomActionButton
