import React, { ReactNode } from 'react'
import { EffectFunction } from '../util'

interface GenericCardTemplateProps {
  children: ReactNode
  onClick?: EffectFunction
  onEdit?: EffectFunction
  onDelete?: EffectFunction
  className?: string
}

const GenericCardTemplate: React.FC<GenericCardTemplateProps> = (props) => (
  <div onClick={props.onClick} className={`m-0 rounded-lg bg-gray-200 p-5 ${props.className ?? ''}`}>
    <div className="mb-2 flex items-center justify-end gap-1">
      {props.onEdit && (
        <div className="cursor-pointer" onClick={props.onEdit}>
          <span className="material-symbols-outlined">edit</span>
        </div>
      )}
      {props.onDelete && (
        <div className="cursor-pointer" onClick={props.onDelete}>
          <span className="material-symbols-outlined">delete</span>
        </div>
      )}
    </div>
    {props.children}
  </div>
)

export default GenericCardTemplate
