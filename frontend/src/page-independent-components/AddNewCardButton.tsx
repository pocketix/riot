import React from 'react'
import GenericCardTemplate from './GenericCardTemplate'
import { EffectFunction } from '../util'

interface AddNewCardButtonProps {
  onClick: EffectFunction
}

const AddNewCardButton: React.FC<AddNewCardButtonProps> = (props) => (
  <GenericCardTemplate
    headerContent={<></>}
    bodyContent={<span className="material-symbols-outlined text-8xl">add_circle</span>}
    onClick={props.onClick}
    className="flex h-[126px] w-[126px] cursor-pointer items-center justify-center"
  ></GenericCardTemplate>
)

export default AddNewCardButton
