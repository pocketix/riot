import React, { ReactNode } from 'react'
import { EffectFunction } from '../util'

interface GenericCardTemplateProps {
  headerContent: ReactNode
  bodyContent: ReactNode
  onClick?: EffectFunction
  className?: string
}

const GenericCardTemplate: React.FC<GenericCardTemplateProps> = (props) => (
  <div onClick={props.onClick} className={`m-0 rounded-lg bg-gray-200 p-5 ${props.className ?? ''}`}>
    <div className="mb-2 flex items-center justify-end gap-1">{props.headerContent}</div>
    {props.bodyContent}
  </div>
)

export default GenericCardTemplate
