import React, { ReactNode } from 'react'
import styles from './styles.module.scss'
import { EffectFunction } from '../../util'

interface GenericCardTemplateProps {
  headerContent: ReactNode
  bodyContent: ReactNode
  onClickHandler?: EffectFunction
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
