import React from 'react'
import GenericCardTemplate from '../../../page-independent-components/GenericCardTemplate'
import { ConsumerFunction } from '../../../util'
import { SdParameter } from '../../../generated/graphql'

interface SDTypeCardProps {
  id: string
  denotation: string
  areParametersDisplayed: boolean
  parameters: SdParameter[]
  initiateSDTypeDeletion: ConsumerFunction<string>
}

const SDTypeCard: React.FC<SDTypeCardProps> = (props) => {
  return (
    <GenericCardTemplate onDelete={() => props.initiateSDTypeDeletion(props.id)} className="max-w-[500px]">
      <p>
        Denotation: <strong>{props.denotation}</strong>
      </p>
      {props.areParametersDisplayed && (
        <div className="mt-2 flex flex-col gap-1 rounded-[5px] bg-[#dcdcdc] px-3 py-1">
          {props.parameters.map((parameter) => (
            <p key={parameter.id}>
              Denotation: <strong>{parameter.denotation}</strong>, Type: <strong>{parameter.type.toString()}</strong>
            </p>
          ))}
        </div>
      )}
    </GenericCardTemplate>
  )
}

export default SDTypeCard
