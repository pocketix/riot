import React from 'react'
import GenericCardTemplate from './GenericCardTemplate'
import { EffectFunction } from '../util'

interface AddNewCardButtonProps {
  onClick: EffectFunction
}

const AddNewCardButton: React.FC<AddNewCardButtonProps> = (props) => (
  <GenericCardTemplate
    headerContent={<></>}
    bodyContent={<span className="material-symbols-outlined pl-5 pr-5 text-8xl">add_circle</span>}
    onClick={props.onClick}
    className="flex cursor-pointer items-center justify-center"
  ></GenericCardTemplate>
)

export default AddNewCardButton
