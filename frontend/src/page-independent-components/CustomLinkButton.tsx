import React from 'react'
import { useNavigate } from 'react-router-dom'
import CustomActionButton from './CustomActionButton'

interface CustomLinkButtonProps {
  route: string
  text: string
  iconIdentifier: string
}

export const CustomLinkButton: React.FC<CustomLinkButtonProps> = ({ route, text, iconIdentifier }) => {
  const navigate = useNavigate()
  return <CustomActionButton action={() => navigate(route)} text={text} iconIdentifier={iconIdentifier} />
}

export default CustomLinkButton
