import * as TbIcons from 'react-icons/tb'

export function getIcon(iconName: string) {
  if (iconName === '') return null
  if (!iconName.startsWith('Tb')) {
    return (TbIcons as Record<string, React.FC>)['TbQuestionMark']
  }

  const IconComponent = (TbIcons as Record<string, React.FC>)[iconName]

  if (!IconComponent) {
    return (TbIcons as Record<string, React.FC>)['TbQuestionMark']
  }

  return IconComponent
}
