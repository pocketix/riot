import * as TbIcons from 'react-icons/tb'
import { IconType } from 'react-icons'

export function getCustomizableIcon(iconName: string): IconType | null {
  if (iconName === '') return null
  if (!iconName.startsWith('Tb')) {
    return (TbIcons as Record<string, IconType>)['TbQuestionMark']
  }

  const IconComponent = (TbIcons as Record<string, IconType>)[iconName]

  if (!IconComponent) {
    return (TbIcons as Record<string, IconType>)['TbQuestionMark']
  }

  return IconComponent
}