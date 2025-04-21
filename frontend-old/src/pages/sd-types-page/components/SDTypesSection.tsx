import React, { useState } from 'react'
import { SdTypesQuery } from '../../../generated/graphql'
import { FormControlLabel, Switch } from '@mui/material'
import SDTypeCard from './SDTypeCard'
import { ConsumerFunction, EffectFunction } from '../../../util'
import AddNewCardButton from '../../../page-independent-components/AddNewCardButton'

interface SDTypesSectionProps {
  sdTypesQueryData: SdTypesQuery
  initiateSDTypeCreation: EffectFunction
  initiateSDTypeDeletion: ConsumerFunction<string>
  anyLoadingOccurs: boolean
  anyErrorOccurred: boolean
}

const SDTypesSection: React.FC<SDTypesSectionProps> = (props) => {
  const [areParametersDisplayed, setParametersDisplayed] = useState<boolean>(true)

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setParametersDisplayed(event.target.checked)
  }

  return (
    <div>
      <FormControlLabel control={<Switch checked={areParametersDisplayed} onChange={handleChange} />} label="Display parameters?" />
      <div className="mt-1 flex flex-wrap gap-5">
        {props.sdTypesQueryData &&
          props.sdTypesQueryData.sdTypes
            .slice()
            .sort((a, b) => parseInt(a.id, 10) - parseInt(b.id, 10))
            .map((sdType) => {
              return (
                <SDTypeCard
                  key={sdType.id}
                  id={sdType.id}
                  denotation={sdType.denotation}
                  areParametersDisplayed={areParametersDisplayed}
                  parameters={sdType.parameters}
                  initiateSDTypeDeletion={props.initiateSDTypeDeletion}
                />
              )
            })}
        <AddNewCardButton onClick={props.initiateSDTypeCreation} />
      </div>
    </div>
  )
}

export default SDTypesSection
