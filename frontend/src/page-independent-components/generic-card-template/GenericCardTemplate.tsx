import React, { ReactNode } from 'react'
import styles from './styles.module.scss'

interface GenericCardTemplateProps {
  headerContent: ReactNode
  bodyContent: ReactNode
}

const GenericCardTemplate: React.FC<GenericCardTemplateProps> = (props) => {
  return (
    <div className={styles.cardContainer}>
      <div className={styles.header}>{props.headerContent}</div>
      {props.bodyContent}
    </div>
  )
}

export default GenericCardTemplate
