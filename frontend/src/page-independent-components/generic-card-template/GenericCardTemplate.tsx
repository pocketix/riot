import React, { ReactNode } from 'react'
import styles from './styles.module.scss'

interface GenericCardTemplateProps {
  headerContent: ReactNode
  bodyContent: ReactNode
  onClickHandler?: () => void
  className?: string
}

const GenericCardTemplate: React.FC<GenericCardTemplateProps> = (props) => {
  return (
    <div onClick={props.onClickHandler} className={`${styles.cardContainer} ${props.className ?? ''}`}>
      <div className={styles.header}>{props.headerContent}</div>
      {props.bodyContent}
    </div>
  )
}

export default GenericCardTemplate
