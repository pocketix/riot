import React from 'react'
import { EffectFunction } from '../settings/KPIDefinitions/components/util'

interface CustomActionButtonProps {
  action: EffectFunction
  text: string
  iconIdentifier: string
}

export const CustomActionButton: React.FC<CustomActionButtonProps> = (props) => (
  <div className="flex cursor-pointer items-center gap-2.5 rounded-md px-9 py-3.5 hover:bg-gray-200" onClick={props.action}>
    <span className="material-symbols-outlined text-4xl">{props.iconIdentifier}</span>
    <span className="text-4xl">{props.text}</span>
  </div>
)

export default CustomActionButton
