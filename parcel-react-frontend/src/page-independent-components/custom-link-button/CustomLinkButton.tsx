import React from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import styles from './CustomLinkButton.module.scss'

interface CustomLinkButtonProps {
  route: string
  text: string
  iconIdentifier: string
}

export const CustomLinkButton: React.FC<CustomLinkButtonProps> = ({ route, text, iconIdentifier }) => {
  const navigate: NavigateFunction = useNavigate()

  return (
    <div className={styles.customLink} onClick={() => navigate(route)}>
      <span className="material-symbols-outlined">{iconIdentifier}</span>
      <span>{text}</span>
    </div>
  )
}

export default CustomLinkButton
