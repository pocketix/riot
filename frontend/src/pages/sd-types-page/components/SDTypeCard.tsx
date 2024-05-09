import React from 'react'
import { Collapse } from '@mui/material'
import GenericCardTemplate from '../../../page-independent-components/GenericCardTemplate'
import { ConsumerFunction } from '../../../util'
import { SdParameter } from '../../../generated/graphql'

interface SDTypeCardProps {
  id: string
  denotation: string
  areParametersDisplayed: boolean
  parameters: SdParameter[]
  deleteSDType: ConsumerFunction<string>
}

const SDTypeCard: React.FC<SDTypeCardProps> = (props) => {
  return (
    <GenericCardTemplate
      headerContent={
        <>
          <div className="cursor-pointer" onClick={() => props.deleteSDType(props.id)}>
            <span className="material-symbols-outlined">delete</span>
          </div>
        </>
      }
      bodyContent={
        <>
          <p>
            Denotation: <strong>{props.denotation}</strong>
          </p>
          <Collapse in={props.areParametersDisplayed}>
            <div className="mt-2 flex flex-col gap-1 rounded-[5px] border-2 border-gray-500 bg-[#dcdcdc] px-3 py-1">
              {props.parameters.map((parameter) => (
                <p key={parameter.id}>
                  Denotation: <strong>{parameter.denotation}</strong>, Type: <strong>{parameter.type.toString()}</strong>
                </p>
              ))}
            </div>
          </Collapse>
        </>
      }
    ></GenericCardTemplate>
  )
}

export default SDTypeCard
