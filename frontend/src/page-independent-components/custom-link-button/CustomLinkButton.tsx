import React from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
import CustomActionButton from '../custom-action-button/CustomActionButton'

interface CustomLinkButtonProps {
  route: string
  text: string
  iconIdentifier: string
}

export const CustomLinkButton: React.FC<CustomLinkButtonProps> = ({ route, text, iconIdentifier }) => {
  const navigate: NavigateFunction = useNavigate()
  return <CustomActionButton action={() => navigate(route)} text={text} iconIdentifier={iconIdentifier} />
}

export default CustomLinkButton
