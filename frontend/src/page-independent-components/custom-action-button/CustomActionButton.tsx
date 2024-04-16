import React from 'react'
import styles from './styles.module.scss'

interface CustomActionButtonProps {
  action: VoidFunction
  text: string
  iconIdentifier: string
}

export const CustomActionButton: React.FC<CustomActionButtonProps> = ({ action, text, iconIdentifier }) => {
  return (
    <div className={styles.customActionButton} onClick={action}>
      <span className="material-symbols-outlined">{iconIdentifier}</span>
      <span>{text}</span>
    </div>
  )
}

export default CustomActionButton
