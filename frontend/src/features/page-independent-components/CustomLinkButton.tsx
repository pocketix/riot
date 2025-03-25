import React from 'react'
import CustomActionButton from './CustomActionButton'
import { useChangeURL } from '../settings/KPIDefinitions/components/util'

interface CustomLinkButtonProps {
  route: string
  text: string
  iconIdentifier: string
}

export const CustomLinkButton: React.FC<CustomLinkButtonProps> = ({ route, text, iconIdentifier }) => {
  const changeURL = useChangeURL()
  return <CustomActionButton action={() => changeURL(route)} text={text} iconIdentifier={iconIdentifier} />
}

export default CustomLinkButton
